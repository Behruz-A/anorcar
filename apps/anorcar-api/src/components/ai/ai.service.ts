import { BadRequestException, HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createHash } from 'crypto';
import { aiConfig, AI_RATE_LIMITED, AI_SYSTEM_INSTRUCTION, AI_UNAVAILABLE } from '../../libs/config/ai.config';
import { AiChatResponse } from '../../libs/dto/ai/ai-chat.response';

@Injectable()
export class AiService {
	private readonly settings: ReturnType<typeof aiConfig>;
	private readonly client: GoogleGenAI | null;
	private readonly buckets = new Map<string, { count: number; expires: number }>();
	private day = '';
	private dailyRequests = 0;
	private active = 0;

	constructor(config: ConfigService) {
		this.settings = aiConfig(config);
		this.client = this.settings.apiKey ? new GoogleGenAI({
			apiKey: this.settings.apiKey,
			httpOptions: { timeout: this.settings.timeoutMs, retryOptions: { attempts: 1 } },
		}) : null;
	}

	private consume(ip: string, memberId?: string): void {
		const now = Date.now();
		const keys = [{ key: `ip:${ip}`, limit: this.settings.ipLimit }];
		if (memberId) keys.push({ key: `user:${memberId}`, limit: this.settings.userLimit });
		const buckets = keys.map(({ key, limit }) => {
			const digest = createHash('sha256').update(key).digest('hex');
			let bucket = this.buckets.get(digest);
			if (!bucket || bucket.expires <= now) {
				if (this.buckets.size >= 10000) {
					for (const [id, value] of this.buckets) if (value.expires <= now) this.buckets.delete(id);
					if (this.buckets.size >= 10000 && !this.buckets.has(digest)) throw new HttpException(AI_RATE_LIMITED, 429);
				}
				bucket = { count: 0, expires: now + 60000 };
				this.buckets.set(digest, bucket);
			}
			if (bucket.count >= limit) throw new HttpException(AI_RATE_LIMITED, 429);
			return bucket;
		});
		const day = new Date(now).toISOString().slice(0, 10);
		if (day !== this.day) { this.day = day; this.dailyRequests = 0; }
		if (this.dailyRequests >= this.settings.dailyLimit || this.active >= this.settings.concurrency)
			throw new ServiceUnavailableException(AI_UNAVAILABLE);
		buckets.forEach((bucket) => bucket.count++);
		this.dailyRequests++;
	}

	public async ask(message: string, ip: string, memberId?: string): Promise<AiChatResponse> {
		if (typeof message !== 'string' || !message.trim() || message.length > 1000)
			throw new BadRequestException('Enter a message between 1 and 1000 characters.');
		if (!this.client) throw new ServiceUnavailableException(AI_UNAVAILABLE);
		this.consume(ip, memberId);
		this.active++;
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const timeout = new Promise<never>((_, reject) => {
				timer = setTimeout(() => { controller.abort(); reject(new Error('AI timeout')); }, this.settings.timeoutMs);
			});
			const response = await Promise.race([
				this.client.models.generateContent({
					model: this.settings.model,
					contents: [{ role: 'user', parts: [{ text: message.trim() }] }],
					config: {
						systemInstruction: AI_SYSTEM_INSTRUCTION,
						maxOutputTokens: this.settings.maxOutputTokens,
						candidateCount: 1,
						abortSignal: controller.signal,
						...(this.settings.model.startsWith('gemini-2.5-') ? { thinkingConfig: { thinkingBudget: 0 } } :
							this.settings.model.startsWith('gemini-3') ? { thinkingConfig: { thinkingLevel: this.settings.model.startsWith('gemini-3.8-') ? ThinkingLevel.LOW : ThinkingLevel.MINIMAL } } : {}),
					},
				}), timeout,
			]);
			const answer = response.text?.trim();
			if (!answer) throw new Error('AI returned no answer');
			return { answer: answer.slice(0, 2000) };
		} catch {
			// Never expose or log SDK exceptions, messages, keys or provider payloads.
			throw new ServiceUnavailableException(AI_UNAVAILABLE);
		} finally {
			clearTimeout(timer);
			this.active--;
		}
	}
}
