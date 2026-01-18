import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TgWidgetData {
  channel: string;
  messageId: number;
}

interface TgDelivery {
  id: string;
  status: string;
  telegramMessageId: string | null;
  channel?: {
    id: string;
    key: string;
    title: string | null;
    username: string | null;
  };
}

interface TgPost {
  id: string;
  articleId: string;
  status: string;
  deliveries?: TgDelivery[];
}

@Injectable()
export class TgPublisherService {
  private readonly logger = new Logger(TgPublisherService.name);
  private readonly baseUrl: string | null;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('TG_PUBLISHER_URL') || null;
  }

  async getWidgetData(tgPostId: string): Promise<TgWidgetData | null> {
    if (!this.baseUrl) {
      this.logger.warn('TG_PUBLISHER_URL not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/posts/${tgPostId}`);

      if (!response.ok) {
        this.logger.warn(`Failed to fetch tg post ${tgPostId}: ${response.status}`);
        return null;
      }

      const post: TgPost = await response.json();

      // Find first successful delivery with telegramMessageId and channel username
      const sentDelivery = post.deliveries?.find(
        (d) => d.status === 'SENT' && d.telegramMessageId && d.channel?.username,
      );

      if (!sentDelivery || !sentDelivery.channel?.username || !sentDelivery.telegramMessageId) {
        return null;
      }

      // telegramMessageId can contain comma-separated values for media groups, take first
      const messageIdStr = sentDelivery.telegramMessageId.split(',')[0].trim();
      const messageId = parseInt(messageIdStr, 10);

      if (!Number.isFinite(messageId)) {
        return null;
      }

      return {
        channel: sentDelivery.channel.username,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Error fetching tg post ${tgPostId}:`, error);
      return null;
    }
  }
}
