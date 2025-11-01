// lib/telegram.ts
const TELEGRAM_BOT_TOKEN_PREPAID = process.env.TELEGRAM_BOT_TOKEN_PREPAID;
const TELEGRAM_CHAT_ID_PREPAID = process.env.TELEGRAM_CHAT_ID_PREPAID;
const TELEGRAM_BOT_TOKEN_COD = process.env.TELEGRAM_BOT_TOKEN_COD;
const TELEGRAM_CHAT_ID_COD = process.env.TELEGRAM_CHAT_ID_COD;

interface TelegramMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
}

export class TelegramService {
  private static getBotConfig(paymentMode: 'online' | 'cod') {
    if (paymentMode === 'cod') {
      return {
        token: TELEGRAM_BOT_TOKEN_COD,
        chatId: TELEGRAM_CHAT_ID_COD
      };
    } else {
      return {
        token: TELEGRAM_BOT_TOKEN_PREPAID,
        chatId: TELEGRAM_CHAT_ID_PREPAID
      };
    }
  }

  private static validateConfig(token?: string, chatId?: string) {
    if (!token || !chatId) {
      throw new Error('Telegram credentials not configured');
    }
  }

  private static formatOrderMessage(order: any): string {
    const paymentMethod = order.paymentMode === 'cod' 
      ? 'Cash on Delivery' 
      : `Online (${order.paymentStatus ? 'Paid' : 'Pending'})`;

    const productsList = order.products
      .map(
        (p: any) => 
          `➤ [${p.product.name}](${this.getProductUrl(p.product._id)}) \n   • Qty: ${p.quantity}${p.size ? ` • Size: ${p.size}` : ''}${p.color ? ` • Color: ${p.color}` : ''}`
      )
      .join('\n');
    
    const orderType = order.paymentMode === 'cod' ? '🪙 COD ORDER' : '💳 ONLINE ORDER';
    
    const msg = `
*${orderType}*
🛍️ *ORDER #${order._id.slice(-6).toUpperCase()}* 🛍️
📅 *Date:* ${new Date(order.orderedAt).toLocaleString()}

👤 *Customer Details:*
• *Name:* ${order.customerName}
• *Phone:* [${order.phoneNumber}](tel:${order.phoneNumber})${order.alternatePhone ? `\n• *Alt Phone:* [${order.alternatePhone}](tel:${order.alternatePhone})` : ''}
${order.instagramId ? `• *Instagram:* @${order.instagramId.replace('@', '')}` : ''}

💳 *Payment:*
• *Amount:* ₹${order.totalAmount.toFixed(2)} (Shipping: ₹${order.shippingCharges.toFixed(2)})
• *Method:* ${paymentMethod}
${order.paymentMode === 'cod' ? `• *Advance Paid:* ₹${order.advanceAmount}\n• *Balance on Delivery:* ₹${order.codRemaining}` : ''}
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
    paymentMode: 'online' | 'cod',
    options: TelegramMessageOptions = { parse_mode: 'Markdown' }
  ): Promise<boolean> {
    try {
      const { token, chatId } = this.getBotConfig(paymentMode);
      this.validateConfig(token, chatId);

      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
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

  public static async sendOrderNotification(order: any): Promise<boolean> {
    try {
      const message = this.formatOrderMessage(order);
      return await this.sendMessage(message, order.paymentMode);
    } catch (error) {
      console.error('Failed to send order notification:', error);
      return false;
    }
  }
}