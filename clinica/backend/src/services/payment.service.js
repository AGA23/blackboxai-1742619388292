const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { LoggerService } = require('./logger.service');
const { NotificationService } = require('./notification.service');
const { AuditService } = require('./audit.service');

class PaymentService {
  /**
   * Create payment intent
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Payment intent
   */
  static async createPaymentIntent(data) {
    try {
      const { amount, currency = 'mxn', customerId, description } = data;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        description,
        metadata: {
          appointmentId: data.appointmentId,
          patientId: data.patientId
        }
      });

      LoggerService.info(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      LoggerService.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create customer
   * @param {Object} data - Customer data
   * @returns {Promise<Object>} Customer
   */
  static async createCustomer(data) {
    try {
      const { email, name, phone, metadata = {} } = data;

      const customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata
      });

      LoggerService.info(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      LoggerService.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Process payment
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Payment result
   */
  static async processPayment(data) {
    try {
      const { paymentMethodId, paymentIntentId, amount, customerId } = data;

      let paymentIntent;

      if (paymentIntentId) {
        paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
      } else {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'mxn',
          customer: customerId,
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            appointmentId: data.appointmentId,
            patientId: data.patientId
          }
        });
      }

      // Handle payment result
      const result = await this.handlePaymentResult(paymentIntent);

      // Audit payment
      await AuditService.log(
        'payment_processed',
        'payment',
        paymentIntent.id,
        data.patientId,
        {
          amount,
          status: paymentIntent.status
        }
      );

      return result;
    } catch (error) {
      LoggerService.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Handle payment result
   * @private
   * @param {Object} paymentIntent - Payment intent
   * @returns {Promise<Object>} Payment result
   */
  static async handlePaymentResult(paymentIntent) {
    try {
      const result = {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id
      };

      if (result.success) {
        // Send notifications
        await NotificationService.sendPaymentNotification({
          type: 'payment_success',
          userId: paymentIntent.metadata.patientId,
          data: {
            amount: paymentIntent.amount / 100,
            appointmentId: paymentIntent.metadata.appointmentId
          }
        });
      }

      return result;
    } catch (error) {
      LoggerService.error('Error handling payment result:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   * @param {Object} data - Refund data
   * @returns {Promise<Object>} Refund result
   */
  static async refundPayment(data) {
    try {
      const { paymentIntentId, amount, reason } = data;

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason
      });

      // Audit refund
      await AuditService.log(
        'payment_refunded',
        'payment',
        paymentIntentId,
        data.userId,
        {
          amount: amount || 'full',
          reason,
          refundId: refund.id
        }
      );

      // Send notification
      await NotificationService.sendPaymentNotification({
        type: 'payment_refunded',
        userId: data.userId,
        data: {
          amount: refund.amount / 100,
          reason
        }
      });

      return refund;
    } catch (error) {
      LoggerService.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Payment methods
   */
  static async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      LoggerService.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Add payment method
   * @param {Object} data - Payment method data
   * @returns {Promise<Object>} Payment method
   */
  static async addPaymentMethod(data) {
    try {
      const { paymentMethodId, customerId } = data;

      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );

      return paymentMethod;
    } catch (error) {
      LoggerService.error('Error adding payment method:', error);
      throw error;
    }
  }

  /**
   * Remove payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Detachment result
   */
  static async removePaymentMethod(paymentMethodId) {
    try {
      return await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      LoggerService.error('Error removing payment method:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} Payment history
   */
  static async getPaymentHistory(customerId) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100
      });

      return paymentIntents.data.map(intent => ({
        id: intent.id,
        amount: intent.amount / 100,
        currency: intent.currency,
        status: intent.status,
        created: new Date(intent.created * 1000),
        metadata: intent.metadata
      }));
    } catch (error) {
      LoggerService.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Generate payment receipt
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Receipt data
   */
  static async generateReceipt(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const customer = await stripe.customers.retrieve(paymentIntent.customer);

      return {
        receiptNumber: `REC-${Date.now()}`,
        date: new Date(paymentIntent.created * 1000),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        customer: {
          name: customer.name,
          email: customer.email
        },
        description: paymentIntent.description,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      LoggerService.error('Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Calculate service cost
   * @param {string} serviceType - Type of service
   * @param {Object} options - Calculation options
   * @returns {Object} Cost calculation
   */
  static calculateServiceCost(serviceType, options = {}) {
    try {
      let baseCost = 0;
      let additionalCosts = [];
      let discounts = [];

      switch (serviceType) {
        case 'consultation':
          baseCost = 800;
          break;
        case 'treatment':
          baseCost = 1500;
          if (options.duration) {
            const additionalTime = Math.max(0, options.duration - 60);
            const timeExtra = Math.ceil(additionalTime / 15) * 200;
            if (timeExtra > 0) {
              additionalCosts.push({
                description: 'Tiempo adicional',
                amount: timeExtra
              });
            }
          }
          break;
        case 'followup':
          baseCost = 600;
          break;
        default:
          throw new Error('Invalid service type');
      }

      // Apply insurance discount if applicable
      if (options.hasInsurance) {
        const insuranceDiscount = baseCost * 0.3;
        discounts.push({
          description: 'Descuento de seguro',
          amount: insuranceDiscount
        });
      }

      // Calculate total
      const subtotal = baseCost + additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const totalDiscounts = discounts.reduce((sum, discount) => sum + discount.amount, 0);
      const total = subtotal - totalDiscounts;

      return {
        baseCost,
        additionalCosts,
        discounts,
        subtotal,
        total,
        currency: 'mxn'
      };
    } catch (error) {
      LoggerService.error('Error calculating service cost:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;