// types/order.ts
export interface OrderProduct {
  product: {
    _id: string;
    name: string;
    // Add other product fields as needed
  };
  quantity: number;
  size?: string;
  color?: string;
  // Add other product variant fields as needed
}

export interface Order {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  customerName: string;
  phoneNumber: string;
  alternatePhone?: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
  orderedAt: string;
  paymentMode: 'online' | 'cod';
  paymentStatus: boolean;
  products: OrderProduct[];
  totalAmount: number;
  shippingCharges: number;
  transactionId?: string;
  instagramId?: string;
}

// lib/telegram.ts
const TELEGRAM_BOT_TOKEN_PREPAID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN_PREPAID;
const TELEGRAM_CHAT_ID_PREPAID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_PREPAID;
const TELEGRAM_BOT_TOKEN_COD = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN_COD;
const TELEGRAM_CHAT_ID_COD = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_COD;

interface TelegramMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
}

export class TelegramService {
  private static getBotConfig(order: Order) {
    const isPrepaid = order.paymentMode === 'online';
    
    if (isPrepaid) {
      return {
        token: TELEGRAM_BOT_TOKEN_PREPAID,
        chatId: TELEGRAM_CHAT_ID_PREPAID,
        type: 'PREPAID'
      };
    } else {
      return {
        token: TELEGRAM_BOT_TOKEN_COD,
        chatId: TELEGRAM_CHAT_ID_COD,
        type: 'COD'
      };
    }
  }

  private static validateConfig(botToken?: string, chatId?: string) {
    if (!botToken || !chatId) {
      throw new Error('Telegram credentials not configured');
    }
  }

  private static formatOrderMessage(order: Order): string {
    const paymentMethod = order.paymentMode === 'cod' 
      ? 'Cash on Delivery' 
      : `Online (${order.paymentStatus ? 'Paid' : 'Pending'})`;

    const productsList = order.products
      .map(
        (p) => 
          `➤ [${p.product.name}](${this.getProductUrl(p.product._id)}) \n   • Qty: ${p.quantity}${p.size ? ` • Size: ${p.size}` : ''}${p.color ? ` • Color: ${p.color}` : ''}`
      )
      .join('\n');
    
    const msg = `
    *YOU HAVE A NEW ${order.paymentMode === 'online' ? 'PREPAID' : 'COD'} ORDER*
🛍️ *ORDER #${order._id.slice(-6).toUpperCase()}* 🛍️
📅 *Date:* ${new Date(order.orderedAt).toLocaleString()}

👤 *Customer Details:*
• *Name:* ${order.customerName}
• *Phone:* [${order.phoneNumber}](tel:${order.phoneNumber})${order.alternatePhone ? `\n• *Alt Phone:* [${order.alternatePhone}](tel:${order.alternatePhone})` : ''}
${order.instagramId ? `• *Instagram:* @${order.instagramId.replace('@', '')}` : ''}

💳 *Payment:*
• *Amount:* ₹${order.totalAmount.toFixed(2)} (Shipping: ₹${order.shippingCharges.toFixed(2)})
• *Method:* ${paymentMethod}
${order.transactionId ? `• *Transaction ID:* ${order.transactionId}` : ''}

📦 *Products (${order.products.length}):*
${productsList}

🏠 *Shipping Address:*
${order.address}
${order.landmark ? `(Landmark: ${order.landmark})\n` : ''}
${order.district}, ${order.state} - ${order.pincode}

🚚 *Shipping Method:* Standard Delivery
    `.trim();
    
    return msg;
  }

  private static getProductUrl(productId: string): string {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/product/${productId}`;
  }

  public static async sendMessage(
    text: string,
    botToken: string,
    chatId: string,
    options: TelegramMessageOptions = { parse_mode: 'Markdown' }
  ): Promise<boolean> {
    try {
      this.validateConfig(botToken, chatId);

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            ...options,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${errorData.description}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      return false;
    }
  }

  public static async sendOrderNotification(order: Order): Promise<boolean> {
    try {
      const botConfig :any = this.getBotConfig(order);
      this.validateConfig(botConfig.token, botConfig.chatId);
       
      const message = this.formatOrderMessage(order);
      return await this.sendMessage(message, botConfig.token, botConfig.chatId);
    } catch (error) {
      console.error('Failed to send order notification:', error);
      return false;
    }
  }

  // Optional: Send to both bots (useful for backup/notifications)
  public static async sendOrderNotificationToBoth(order: Order): Promise<{
    prepaid: boolean;
    cod: boolean;
  }> {
    const results = {
      prepaid: false,
      cod: false
    };

    // Send to prepaid bot
    if (TELEGRAM_BOT_TOKEN_PREPAID && TELEGRAM_CHAT_ID_PREPAID) {
      try {
        const message = this.formatOrderMessage(order);
        results.prepaid = await this.sendMessage(
          message, 
          TELEGRAM_BOT_TOKEN_PREPAID, 
          TELEGRAM_CHAT_ID_PREPAID
        );
      } catch (error) {
        console.error('Failed to send to prepaid bot:', error);
      }
    }

    // Send to COD bot
    if (TELEGRAM_BOT_TOKEN_COD && TELEGRAM_CHAT_ID_COD) {
      try {
        const message = this.formatOrderMessage(order);
        results.cod = await this.sendMessage(
          message, 
          TELEGRAM_BOT_TOKEN_COD, 
          TELEGRAM_CHAT_ID_COD
        );
      } catch (error) {
        console.error('Failed to send to COD bot:', error);
      }
    }

    return results;
  }
}

// Example usage:
// await TelegramService.sendOrderNotification(order); // Sends to appropriate bot based on payment method
// await TelegramService.sendOrderNotificationToBoth(order); // Sends to both bots