import { BedrockRuntimeClient, BedrockRuntimeClientConfig } from '@aws-sdk/client-bedrock-runtime';
import { LanguageModelV1 } from '@ai-sdk/provider';

type BedrockChatModelId = 'amazon.titan-tg1-large' | 'amazon.titan-text-express-v1' | 'anthropic.claude-v2:1' | 'anthropic.claude-3-sonnet-20240229-v1:0' | 'anthropic.claude-3-5-sonnet-20240620-v1:0' | 'anthropic.claude-3-haiku-20240307-v1:0' | 'anthropic.claude-3-opus-20240229-v1:0' | 'cohere.command-r-v1:0' | 'cohere.command-r-plus-v1:0' | 'meta.llama2-13b-chat-v1' | 'meta.llama2-70b-chat-v1' | 'meta.llama3-8b-instruct-v1:0' | 'meta.llama3-70b-instruct-v1:0' | 'mistral.mistral-7b-instruct-v0:2' | 'mistral.mixtral-8x7b-instruct-v0:1' | 'mistral.mistral-large-2402-v1:0' | 'mistral.mistral-small-2402-v1:0' | (string & {});
interface BedrockChatSettings {
    /**
  Additional inference parameters that the model supports,
  beyond the base set of inference parameters that Converse
  supports in the inferenceConfig field
  */
    additionalModelRequestFields?: Record<string, any>;
}

type BedrockChatConfig = {
    client: BedrockRuntimeClient;
    generateId: () => string;
};
declare class BedrockChatLanguageModel implements LanguageModelV1 {
    readonly specificationVersion = "v1";
    readonly provider = "amazon-bedrock";
    readonly defaultObjectGenerationMode = "tool";
    readonly modelId: BedrockChatModelId;
    readonly settings: BedrockChatSettings;
    private readonly config;
    constructor(modelId: BedrockChatModelId, settings: BedrockChatSettings, config: BedrockChatConfig);
    private getArgs;
    doGenerate(options: Parameters<LanguageModelV1['doGenerate']>[0]): Promise<Awaited<ReturnType<LanguageModelV1['doGenerate']>>>;
    doStream(options: Parameters<LanguageModelV1['doStream']>[0]): Promise<Awaited<ReturnType<LanguageModelV1['doStream']>>>;
}

interface AmazonBedrockProviderSettings {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    /**
     * Complete Bedrock configuration for setting advanced authentication and
     * other options. When this is provided, the region, accessKeyId, and
     * secretAccessKey settings are ignored.
     */
    bedrockOptions?: BedrockRuntimeClientConfig;
    generateId?: () => string;
}
interface AmazonBedrockProvider {
    (modelId: BedrockChatModelId, settings?: BedrockChatSettings): BedrockChatLanguageModel;
    languageModel(modelId: BedrockChatModelId, settings?: BedrockChatSettings): BedrockChatLanguageModel;
}
/**
Create an Amazon Bedrock provider instance.
 */
declare function createAmazonBedrock(options?: AmazonBedrockProviderSettings): AmazonBedrockProvider;
/**
Default Bedrock provider instance.
 */
declare const bedrock: AmazonBedrockProvider;

export { type AmazonBedrockProvider, type AmazonBedrockProviderSettings, bedrock, createAmazonBedrock };
