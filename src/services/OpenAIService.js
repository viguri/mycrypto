import { Configuration, OpenAIApi } from 'openai';
import logger from '../utils/logger/index.js';

class OpenAIService {
    constructor() {
        this.configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.openai = new OpenAIApi(this.configuration);
        this.model = 'gpt-4';
        
        // System message to define chatbot's behavior
        this.systemMessage = {
            role: 'system',
            content: `You are MyCryptoAssistant, a helpful AI assistant for the MyCrypto blockchain application. 
            You can help users with:
            - Creating and managing wallets
            - Making transactions
            - Understanding blockchain concepts
            - Checking wallet balances and transaction history
            - Providing market insights and recommendations
            
            Always be security-conscious and never ask for private keys or sensitive information.
            Format responses in a clear, concise manner.`
        };
    }

    async generateResponse(userMessage, context = {}) {
        try {
            if (!this.configuration.apiKey) {
                throw new Error('OpenAI API key is not configured');
            }

            const messages = [
                this.systemMessage,
                {
                    role: 'user',
                    content: this._formatMessage(userMessage, context)
                }
            ];

            const completion = await this.openai.createChatCompletion({
                model: this.model,
                messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            const response = completion.data.choices[0].message.content;
            
            logger.info('AI response generated', {
                component: 'OpenAIService',
                messageLength: response.length,
                tokensUsed: completion.data.usage.total_tokens
            });

            return {
                response,
                usage: completion.data.usage
            };
        } catch (error) {
            logger.error('Failed to generate AI response', {
                component: 'OpenAIService',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    _formatMessage(message, context) {
        // Add relevant context to the user's message
        const contextInfo = [];
        
        if (context.walletAddress) {
            contextInfo.push(`Current wallet: ${context.walletAddress}`);
        }
        
        if (context.balance) {
            contextInfo.push(`Current balance: ${context.balance}`);
        }
        
        if (context.lastTransaction) {
            contextInfo.push(`Last transaction: ${context.lastTransaction}`);
        }

        return [
            ...contextInfo,
            '',
            `User message: ${message}`
        ].join('\n');
    }
}

export default new OpenAIService();
