"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  bedrock: () => bedrock,
  createAmazonBedrock: () => createAmazonBedrock
});
module.exports = __toCommonJS(src_exports);

// src/bedrock-provider.ts
var import_provider_utils2 = require("@ai-sdk/provider-utils");
var import_client_bedrock_runtime2 = require("@aws-sdk/client-bedrock-runtime");

// src/bedrock-chat-language-model.ts
var import_provider2 = require("@ai-sdk/provider");
var import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");

// src/convert-to-bedrock-chat-messages.ts
var import_provider = require("@ai-sdk/provider");
var import_provider_utils = require("@ai-sdk/provider-utils");
async function convertToBedrockChatMessages({
  prompt,
  downloadImplementation = import_provider_utils.download
}) {
  var _a, _b;
  let system = void 0;
  const messages = [];
  for (const { role, content } of prompt) {
    switch (role) {
      case "system": {
        if (system != null) {
          throw new import_provider.UnsupportedFunctionalityError({
            functionality: "Multiple system messages"
          });
        }
        system = content;
        break;
      }
      case "user": {
        const bedrockMessageContent = [];
        for (const part of content) {
          switch (part.type) {
            case "text": {
              bedrockMessageContent.push({ text: part.text });
              break;
            }
            case "image": {
              let data;
              let mimeType;
              if (part.image instanceof URL) {
                const downloadResult = await downloadImplementation({
                  url: part.image
                });
                data = downloadResult.data;
                mimeType = downloadResult.mimeType;
              } else {
                data = part.image;
                mimeType = part.mimeType;
              }
              bedrockMessageContent.push({
                image: {
                  format: (_b = (_a = mimeType != null ? mimeType : part.mimeType) == null ? void 0 : _a.split(
                    "/"
                  )) == null ? void 0 : _b[1],
                  source: {
                    bytes: data != null ? data : part.image
                  }
                }
              });
              break;
            }
          }
        }
        messages.push({
          role: "user",
          content: bedrockMessageContent
        });
        break;
      }
      case "assistant": {
        const toolUse = [];
        let text = "";
        for (const part of content) {
          switch (part.type) {
            case "text": {
              text += part.text;
              break;
            }
            case "tool-call": {
              toolUse.push({
                toolUseId: part.toolCallId,
                name: part.toolName,
                input: part.args
              });
              break;
            }
            default: {
              const _exhaustiveCheck = part;
              throw new Error(`Unsupported part: ${_exhaustiveCheck}`);
            }
          }
        }
        messages.push({
          role: "assistant",
          content: [
            ...text ? [{ text }] : [],
            ...toolUse.map((toolUse2) => ({ toolUse: toolUse2 }))
          ]
        });
        break;
      }
      case "tool":
        messages.push({
          role: "user",
          content: content.map((part) => ({
            toolResult: {
              toolUseId: part.toolCallId,
              status: part.isError ? "error" : "success",
              content: [{ text: JSON.stringify(part.result) }]
            }
          }))
        });
        break;
      default: {
        throw new Error(`Unsupported role: ${role}`);
      }
    }
  }
  return { system, messages };
}

// src/map-bedrock-finish-reason.ts
function mapBedrockFinishReason(finishReason) {
  switch (finishReason) {
    case "stop_sequence":
    case "end_turn":
      return "stop";
    case "max_tokens":
      return "length";
    case "content_filtered":
      return "content-filter";
    case "tool_use":
      return "tool-calls";
    default:
      return "unknown";
  }
}

// src/bedrock-chat-language-model.ts
var BedrockChatLanguageModel = class {
  constructor(modelId, settings, config) {
    this.specificationVersion = "v1";
    this.provider = "amazon-bedrock";
    this.defaultObjectGenerationMode = "tool";
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }
  async getArgs({
    mode,
    prompt,
    maxTokens,
    temperature,
    topP,
    frequencyPenalty,
    presencePenalty,
    seed,
    headers
  }) {
    var _a;
    const type = mode.type;
    const warnings = [];
    if (frequencyPenalty != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "frequencyPenalty"
      });
    }
    if (presencePenalty != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "presencePenalty"
      });
    }
    if (seed != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "seed"
      });
    }
    if (headers != null) {
      warnings.push({
        type: "unsupported-setting",
        setting: "headers"
      });
    }
    const { system, messages } = await convertToBedrockChatMessages({ prompt });
    const baseArgs = {
      modelId: this.modelId,
      system: system ? [{ text: system }] : void 0,
      additionalModelRequestFields: this.settings.additionalModelRequestFields,
      inferenceConfig: {
        maxTokens,
        temperature,
        topP
      },
      messages
    };
    switch (type) {
      case "regular": {
        const toolConfig = prepareToolsAndToolChoice(mode);
        return {
          ...baseArgs,
          ...((_a = toolConfig.tools) == null ? void 0 : _a.length) ? { toolConfig } : {}
        };
      }
      case "object-json": {
        throw new import_provider2.UnsupportedFunctionalityError({
          functionality: "json-mode object generation"
        });
      }
      case "object-tool": {
        return {
          ...baseArgs,
          toolConfig: {
            tools: [
              {
                toolSpec: {
                  name: mode.tool.name,
                  description: mode.tool.description,
                  inputSchema: {
                    json: mode.tool.parameters
                  }
                }
              }
            ],
            toolChoice: { tool: { name: mode.tool.name } }
          }
        };
      }
      case "object-grammar": {
        throw new import_provider2.UnsupportedFunctionalityError({
          functionality: "grammar-mode object generation"
        });
      }
      default: {
        const _exhaustiveCheck = type;
        throw new Error(`Unsupported type: ${_exhaustiveCheck}`);
      }
    }
  }
  async doGenerate(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const args = await this.getArgs(options);
    const response = await this.config.client.send(new import_client_bedrock_runtime.ConverseCommand(args));
    const { messages: rawPrompt, ...rawSettings } = args;
    return {
      text: (_d = (_c = (_b = (_a = response.output) == null ? void 0 : _a.message) == null ? void 0 : _b.content) == null ? void 0 : _c.map((part) => {
        var _a2;
        return (_a2 = part.text) != null ? _a2 : "";
      }).join("")) != null ? _d : void 0,
      toolCalls: (_h = (_g = (_f = (_e = response.output) == null ? void 0 : _e.message) == null ? void 0 : _f.content) == null ? void 0 : _g.filter((part) => !!part.toolUse)) == null ? void 0 : _h.map((part) => {
        var _a2, _b2, _c2, _d2, _e2, _f2;
        return {
          toolCallType: "function",
          toolCallId: (_b2 = (_a2 = part.toolUse) == null ? void 0 : _a2.toolUseId) != null ? _b2 : this.config.generateId(),
          toolName: (_d2 = (_c2 = part.toolUse) == null ? void 0 : _c2.name) != null ? _d2 : `tool-${this.config.generateId()}`,
          args: JSON.stringify((_f2 = (_e2 = part.toolUse) == null ? void 0 : _e2.input) != null ? _f2 : "")
        };
      }),
      finishReason: mapBedrockFinishReason(response.stopReason),
      usage: {
        promptTokens: (_j = (_i = response.usage) == null ? void 0 : _i.inputTokens) != null ? _j : Number.NaN,
        completionTokens: (_l = (_k = response.usage) == null ? void 0 : _k.outputTokens) != null ? _l : Number.NaN
      },
      rawCall: { rawPrompt, rawSettings },
      warnings: []
    };
  }
  async doStream(options) {
    const args = await this.getArgs(options);
    const response = await this.config.client.send(
      new import_client_bedrock_runtime.ConverseStreamCommand({ ...args })
    );
    const { messages: rawPrompt, ...rawSettings } = args;
    let finishReason = "other";
    let usage = {
      promptTokens: Number.NaN,
      completionTokens: Number.NaN
    };
    if (!response.stream) {
      throw new Error("No stream found");
    }
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response.stream) {
          controller.enqueue({ success: true, value: chunk });
        }
        controller.close();
      }
    });
    let toolName = "";
    let toolCallId = "";
    let toolCallArgs = "";
    return {
      stream: stream.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
            function enqueueError(error) {
              finishReason = "error";
              controller.enqueue({ type: "error", error });
            }
            if (!chunk.success) {
              enqueueError(chunk.error);
              return;
            }
            const value = chunk.value;
            if (value.internalServerException) {
              enqueueError(value.internalServerException);
              return;
            }
            if (value.modelStreamErrorException) {
              enqueueError(value.modelStreamErrorException);
              return;
            }
            if (value.throttlingException) {
              enqueueError(value.throttlingException);
              return;
            }
            if (value.validationException) {
              enqueueError(value.validationException);
              return;
            }
            if (value.messageStop) {
              finishReason = mapBedrockFinishReason(
                value.messageStop.stopReason
              );
            }
            if (value.metadata) {
              usage = {
                promptTokens: (_b = (_a = value.metadata.usage) == null ? void 0 : _a.inputTokens) != null ? _b : Number.NaN,
                completionTokens: (_d = (_c = value.metadata.usage) == null ? void 0 : _c.outputTokens) != null ? _d : Number.NaN
              };
            }
            if ((_f = (_e = value.contentBlockDelta) == null ? void 0 : _e.delta) == null ? void 0 : _f.text) {
              controller.enqueue({
                type: "text-delta",
                textDelta: value.contentBlockDelta.delta.text
              });
            }
            if ((_h = (_g = value.contentBlockStart) == null ? void 0 : _g.start) == null ? void 0 : _h.toolUse) {
              const toolUse = value.contentBlockStart.start.toolUse;
              toolName = (_i = toolUse.name) != null ? _i : "";
              toolCallId = (_j = toolUse.toolUseId) != null ? _j : "";
            }
            if ((_l = (_k = value.contentBlockDelta) == null ? void 0 : _k.delta) == null ? void 0 : _l.toolUse) {
              toolCallArgs += (_m = value.contentBlockDelta.delta.toolUse.input) != null ? _m : "";
              controller.enqueue({
                type: "tool-call-delta",
                toolCallType: "function",
                toolCallId,
                toolName,
                argsTextDelta: (_n = value.contentBlockDelta.delta.toolUse.input) != null ? _n : ""
              });
            }
            if (value.contentBlockStop && toolCallArgs.length > 0) {
              controller.enqueue({
                type: "tool-call",
                toolCallType: "function",
                toolCallId,
                toolName,
                args: toolCallArgs
              });
            }
          },
          flush(controller) {
            controller.enqueue({
              type: "finish",
              finishReason,
              usage
            });
          }
        })
      ),
      rawCall: { rawPrompt, rawSettings },
      warnings: []
    };
  }
};
function prepareToolsAndToolChoice(mode) {
  var _a;
  const tools = ((_a = mode.tools) == null ? void 0 : _a.length) ? mode.tools : void 0;
  if (tools == null) {
    return { tools: void 0, toolChoice: void 0 };
  }
  const mappedTools = tools.map((tool) => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: {
        json: tool.parameters
      }
    }
  }));
  const toolChoice = mode.toolChoice;
  if (toolChoice == null) {
    return { tools: mappedTools, toolChoice: void 0 };
  }
  const type = toolChoice.type;
  switch (type) {
    case "auto":
      return { tools: mappedTools, toolChoice: { auto: {} } };
    case "required":
      return { tools: mappedTools, toolChoice: { any: {} } };
    case "none":
      return { tools: void 0, toolChoice: void 0 };
    case "tool":
      return {
        tools: mappedTools,
        toolChoice: { tool: { name: toolChoice.toolName } }
      };
    default: {
      const _exhaustiveCheck = type;
      throw new Error(`Unsupported tool choice type: ${_exhaustiveCheck}`);
    }
  }
}

// src/bedrock-provider.ts
function createAmazonBedrock(options = {}) {
  const createBedrockRuntimeClient = () => {
    var _a;
    return new import_client_bedrock_runtime2.BedrockRuntimeClient(
      (_a = options.bedrockOptions) != null ? _a : {
        region: (0, import_provider_utils2.loadSetting)({
          settingValue: options.region,
          settingName: "region",
          environmentVariableName: "AWS_REGION",
          description: "AWS region"
        }),
        credentials: {
          accessKeyId: (0, import_provider_utils2.loadSetting)({
            settingValue: options.accessKeyId,
            settingName: "accessKeyId",
            environmentVariableName: "AWS_ACCESS_KEY_ID",
            description: "AWS access key ID"
          }),
          secretAccessKey: (0, import_provider_utils2.loadSetting)({
            settingValue: options.secretAccessKey,
            settingName: "secretAccessKey",
            environmentVariableName: "AWS_SECRET_ACCESS_KEY",
            description: "AWS secret access key"
          })
        }
      }
    );
  };
  const createChatModel = (modelId, settings = {}) => new BedrockChatLanguageModel(modelId, settings, {
    client: createBedrockRuntimeClient(),
    generateId: import_provider_utils2.generateId
  });
  const provider = function(modelId, settings) {
    if (new.target) {
      throw new Error(
        "The Amazon Bedrock model function cannot be called with the new keyword."
      );
    }
    return createChatModel(modelId, settings);
  };
  provider.languageModel = createChatModel;
  return provider;
}
var bedrock = createAmazonBedrock();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bedrock,
  createAmazonBedrock
});
//# sourceMappingURL=index.js.map