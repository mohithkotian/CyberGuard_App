const logger = require('./logger');
const emailAgentService = require('../services/emailAgentService');

const sendEmail = async (options) => {
  try {
    const result = await emailAgentService.sendRawEmail({
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
      fromName: 'CyberGuard System',
    });

    if (result.success) {
      logger.info(`Email successfully sent via ${result.provider} to ${options.email}`);
    } else {
      logger.error(`Error sending email to ${options.email}: ${result.error}`);
    }
    return result;
  } catch (error) {
    logger.error(`Error sending email to ${options.email}: ${error.message}`);
    // Don't throw the error so that the main flow (e.g. creating complaint) isn't interrupted by an email failure
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
