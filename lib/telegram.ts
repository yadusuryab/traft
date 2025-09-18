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
const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

interface TelegramMessageOptions {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
}

export class TelegramService {
  private static validateConfig() {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error('Telegram credentials not configured');
    }
  }


  private static formatOrderMessage(order: Order): string {
    const paymentMethod = order.paymentMode === 'cod' 
      ? 'Cash on Delivery' 
      : `Online (${order.paymentStatus ? 'Paid' : 'Pending'})`;

    const productsList = order.products
      .map(p => `➤ [${p.product.name}](${this.getProductUrl(p.product._id)}) \n   • Qty: ${p.quantity}${p.size ? ` • Size: ${p.size}` : ''}`)
      .join('\n');

    return `
    *YOU HAVE A NEW ORDER*
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
  }

  private static getProductUrl(productId: string): string {
    return `${process.env.NEXT_PUBLIC_BASE_URL}/product/${productId}`;
  }

  public static async sendMessage(
    text: string,
    options: TelegramMessageOptions = { parse_mode: 'Markdown' }
  ): Promise<boolean> {
    try {
      this.validateConfig();

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
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
      this.validateConfig();
       
      const message = this.formatOrderMessage(order);
      return await this.sendMessage(message);
    } catch (error) {
      console.error('Failed to send order notification:', error);
      return false;
    }
  }
}

// Example usage:
// await TelegramService.sendOrderNotification(order);