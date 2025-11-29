import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Robot,
  Brain,
  ChatCircle,
  PaperPlaneTilt,
  Wallet,
  ArrowsLeftRight,
  ChartLine,
  ShieldCheck,
  Sparkle,
  Lightning,
  Memory,
  Gear,
  Plugs,
  PlugsConnected,
  Trash,
  ArrowClockwise,
  Plus,
  CircleNotch,
} from '@phosphor-icons/react';
import { formatTimeAgo } from '@/lib/mock-data';
import { useLocalLLM } from '@/hooks/use-local-llm';
import type { AIMessage, AIMemoryItem, AICapability, LLMProvider } from '@/lib/types';

function getCapabilityIcon(iconName: string) {
  const icons: Record<string, React.ReactNode> = {
    Brain: <Brain size={18} weight="duotone" />,
    ChartLine: <ChartLine size={18} weight="duotone" />,
    ChatCircle: <ChatCircle size={18} weight="duotone" />,
    Robot: <Robot size={18} weight="duotone" />,
    Wallet: <Wallet size={18} weight="duotone" />,
    ArrowsLeftRight: <ArrowsLeftRight size={18} weight="duotone" />,
    ShieldCheck: <ShieldCheck size={18} weight="duotone" />,
  };
  return icons[iconName] || <Sparkle size={18} weight="duotone" />;
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'memory':
      return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'language':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'control':
      return 'bg-green-100 text-green-700 border-green-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'memory':
      return '记忆';
    case 'language':
      return '语言';
    case 'control':
      return '控制';
    default:
      return category;
  }
}

function getMemoryTypeColor(type: string): string {
  switch (type) {
    case 'preference':
      return 'bg-blue-50 border-blue-200';
    case 'transaction_pattern':
      return 'bg-green-50 border-green-200';
    case 'contact':
      return 'bg-purple-50 border-purple-200';
    case 'insight':
      return 'bg-amber-50 border-amber-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

function getMemoryTypeLabel(type: string): string {
  switch (type) {
    case 'preference':
      return '偏好';
    case 'transaction_pattern':
      return '交易模式';
    case 'contact':
      return '联系人';
    case 'insight':
      return '洞察';
    default:
      return type;
  }
}

interface MessageBubbleProps {
  message: AIMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <Robot size={16} weight="duotone" className="text-primary" />
            <span className="text-xs font-medium text-primary">OmniCore AI</span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {message.action && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Lightning size={12} weight="fill" />
              <span>操作: {message.action.type}</span>
              <Badge variant="outline" className="text-xs py-0">
                {message.action.status === 'completed' ? '✓ 完成' : message.action.status}
              </Badge>
            </div>
          </div>
        )}
        <div className="text-xs opacity-60 mt-1">
          {formatTimeAgo(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

interface MemoryCardProps {
  memory: AIMemoryItem;
}

function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <Card className={`${getMemoryTypeColor(memory.type)} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {getMemoryTypeLabel(memory.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                置信度: {Math.round(memory.confidence * 100)}%
              </span>
            </div>
            <div className="font-medium text-sm">{memory.key}</div>
            <div className="text-sm text-muted-foreground mt-1">{memory.value}</div>
          </div>
          <Brain size={20} weight="duotone" className="text-purple-500 ml-2" />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>使用 {memory.usageCount} 次</span>
          <span>学习于 {formatTimeAgo(memory.learnedAt)}</span>
        </div>
        <Progress value={memory.confidence * 100} className="h-1 mt-2" />
      </CardContent>
    </Card>
  );
}

interface CapabilityCardProps {
  capability: AICapability;
  onToggle: (id: string) => void;
}

function CapabilityCard({ capability, onToggle }: CapabilityCardProps) {
  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${getCategoryColor(capability.category)}`}>
              {getCapabilityIcon(capability.icon)}
            </div>
            <div>
              <div className="font-medium text-sm flex items-center gap-2">
                {capability.name}
                <Badge variant="outline" className={`text-xs ${getCategoryColor(capability.category)}`}>
                  {getCategoryLabel(capability.category)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {capability.description}
              </div>
            </div>
          </div>
          <Switch
            checked={capability.enabled}
            onCheckedChange={() => onToggle(capability.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function AIAssistant() {
  const {
    config,
    connectionStatus,
    availableModels,
    messages,
    memories,
    capabilities,
    isConnecting,
    isGenerating,
    streamingContent,
    updateConfig,
    refreshConnection,
    sendMessage,
    clearConversation,
    addNewMemory,
    deleteMemory,
    toggleCapability,
    clearAllStoredData,
  } = useLocalLLM();

  const [inputValue, setInputValue] = useState('');
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleAddMemory = () => {
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) {
      toast.error('请填写记忆标题和内容');
      return;
    }
    addNewMemory({
      type: 'preference',
      key: newMemoryKey,
      value: newMemoryValue,
      confidence: 0.9,
    });
    setNewMemoryKey('');
    setNewMemoryValue('');
    toast.success('记忆已添加');
  };

  const handleClearAll = () => {
    clearAllStoredData();
    toast.success('所有数据已清除');
  };

  const memoryCapabilities = capabilities.filter((c) => c.category === 'memory');
  const languageCapabilities = capabilities.filter((c) => c.category === 'language');
  const controlCapabilities = capabilities.filter((c) => c.category === 'control');

  const isConnected = connectionStatus?.connected ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Robot size={32} weight="duotone" className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">AI 智能助手</h2>
            <p className="text-muted-foreground">
              具备记忆、语言理解和全面控制能力的本地智能助手
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            className="gap-1" 
            variant={isConnected ? 'default' : 'secondary'}
          >
            {isConnected ? (
              <PlugsConnected size={14} weight="fill" />
            ) : (
              <Plugs size={14} weight="fill" />
            )}
            {isConnected ? `已连接 ${config.model}` : '未连接'}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={refreshConnection}
            disabled={isConnecting}
          >
            <ArrowClockwise 
              size={18} 
              weight="bold" 
              className={isConnecting ? 'animate-spin' : ''} 
            />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="chat" className="gap-2">
            <ChatCircle size={18} weight="duotone" />
            <span className="hidden sm:inline">对话</span>
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-2">
            <Memory size={18} weight="duotone" />
            <span className="hidden sm:inline">记忆</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Plugs size={18} weight="duotone" />
            <span className="hidden sm:inline">配置</span>
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="gap-2">
            <Gear size={18} weight="duotone" />
            <span className="hidden sm:inline">能力</span>
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ChatCircle size={20} weight="duotone" />
                    智能对话
                  </CardTitle>
                  <CardDescription>
                    使用自然语言与 AI 助手交流，执行钱包操作
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearConversation}
                  className="gap-2"
                >
                  <Trash size={14} weight="duotone" />
                  清空
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
                {messages.length === 0 && !streamingContent && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Robot size={48} weight="duotone" className="mb-4 text-primary/50" />
                    <p className="text-center">开始与 AI 助手对话吧！</p>
                    <p className="text-sm text-center mt-2">您可以询问钱包余额、创建交易、分析风险等</p>
                  </div>
                )}
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {/* Streaming response */}
                {(isGenerating && streamingContent) && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Robot size={16} weight="duotone" className="text-primary" />
                        <span className="text-xs font-medium text-primary">OmniCore AI</span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{streamingContent}</div>
                    </div>
                  </div>
                )}
                {/* Thinking indicator */}
                {(isGenerating && !streamingContent) && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CircleNotch size={16} weight="bold" className="text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="输入您的问题或指令..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleSendMessage} 
                  className="gap-2"
                  disabled={isGenerating || !inputValue.trim()}
                >
                  {isGenerating ? (
                    <CircleNotch size={18} weight="bold" className="animate-spin" />
                  ) : (
                    <PaperPlaneTilt size={18} weight="fill" />
                  )}
                  发送
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['查看钱包余额', '创建新交易', '分析风险', 'DeFi策略推荐', '你好'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputValue(suggestion)}
                    className="text-xs"
                    disabled={isGenerating}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain size={20} weight="duotone" className="text-purple-500" />
                AI 记忆库
              </CardTitle>
              <CardDescription>
                AI 从您的操作中学习到的偏好、模式和洞察 - 数据存储在本地
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add new memory form */}
              <div className="p-4 bg-muted rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Plus size={16} weight="bold" className="text-primary" />
                  <span className="font-medium text-sm">添加新记忆</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="记忆标题（如：首选网络）"
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                  />
                  <Input
                    placeholder="记忆内容（如：Ethereum 和 Polygon）"
                    value={newMemoryValue}
                    onChange={(e) => setNewMemoryValue(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddMemory} size="sm" className="mt-3 gap-2">
                  <Plus size={14} weight="bold" />
                  添加记忆
                </Button>
              </div>

              {/* Memory list */}
              {memories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Memory size={48} weight="duotone" className="mx-auto mb-4 text-purple-500/50" />
                  <p>还没有学习到任何记忆</p>
                  <p className="text-sm mt-2">与 AI 对话时，它会自动学习您的偏好</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {memories.map((memory) => (
                    <MemoryCardWithDelete 
                      key={memory.id} 
                      memory={memory} 
                      onDelete={() => deleteMemory(memory.id)}
                    />
                  ))}
                </div>
              )}

              {/* Memory stats */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkle size={16} weight="fill" className="text-amber-500" />
                  <span className="font-medium text-sm">记忆统计</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{memories.length}</div>
                    <div className="text-xs text-muted-foreground">已学习记忆</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {memories.length > 0
                        ? Math.round(
                            memories.reduce((acc, m) => acc + m.confidence, 0) /
                              memories.length *
                              100
                          )
                        : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">平均置信度</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {memories.reduce((acc, m) => acc + m.usageCount, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">总使用次数</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plugs size={20} weight="duotone" className="text-blue-500" />
                本地大模型配置
              </CardTitle>
              <CardDescription>
                配置本地运行的 AI 模型（如 Ollama）或使用模拟模式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection status */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isConnected ? (
                        <PlugsConnected size={24} weight="duotone" className="text-green-600" />
                      ) : (
                        <Plugs size={24} weight="duotone" className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {isConnected ? '连接成功' : '未连接'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {connectionStatus?.error || (isConnected ? `模型: ${connectionStatus?.model}` : '请检查配置')}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={refreshConnection}
                    disabled={isConnecting}
                    className="gap-2"
                  >
                    <ArrowClockwise 
                      size={16} 
                      weight="bold" 
                      className={isConnecting ? 'animate-spin' : ''} 
                    />
                    刷新
                  </Button>
                </div>
              </div>

              {/* Provider selection */}
              <div className="space-y-2">
                <Label>模型提供商</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: LLMProvider) => updateConfig({ provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择提供商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama（本地）</SelectItem>
                    <SelectItem value="mock">模拟模式（无需服务）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ollama 需要在本地安装并运行，模拟模式使用预设回复
                </p>
              </div>

              {/* Endpoint configuration (only for ollama) */}
              {config.provider === 'ollama' && (
                <>
                  <div className="space-y-2">
                    <Label>服务地址</Label>
                    <Input
                      value={config.endpoint}
                      onChange={(e) => updateConfig({ endpoint: e.target.value })}
                      placeholder="http://localhost:11434"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ollama 默认运行在 http://localhost:11434
                    </p>
                  </div>

                  {/* Model selection */}
                  <div className="space-y-2">
                    <Label>模型选择</Label>
                    {availableModels.length > 0 ? (
                      <Select
                        value={config.model}
                        onValueChange={(value) => updateConfig({ model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择模型" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
                            <SelectItem key={model.name} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={config.model}
                        onChange={(e) => updateConfig({ model: e.target.value })}
                        placeholder="qwen2.5:7b"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      推荐: qwen2.5:7b, llama3.2, mistral 等支持中文的模型
                    </p>
                  </div>
                </>
              )}

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>创造性 (Temperature)</Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  value={[config.temperature || 0.7]}
                  onValueChange={([value]) => updateConfig({ temperature: value })}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  较低值更准确稳定，较高值更有创造性
                </p>
              </div>

              <Separator />

              {/* Danger zone */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-destructive">危险操作</div>
                <Button 
                  variant="destructive" 
                  onClick={handleClearAll}
                  className="gap-2"
                >
                  <Trash size={16} weight="bold" />
                  清除所有数据
                </Button>
                <p className="text-xs text-muted-foreground">
                  这将清除所有对话历史、记忆和配置
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain size={20} weight="duotone" className="text-purple-500" />
                  记忆能力
                </CardTitle>
                <CardDescription>
                  学习和记住用户偏好与模式
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {memoryCapabilities.map((cap) => (
                  <CapabilityCard
                    key={cap.id}
                    capability={cap}
                    onToggle={toggleCapability}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChatCircle size={20} weight="duotone" className="text-blue-500" />
                  语言能力
                </CardTitle>
                <CardDescription>
                  自然语言理解与生成
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {languageCapabilities.map((cap) => (
                  <CapabilityCard
                    key={cap.id}
                    capability={cap}
                    onToggle={toggleCapability}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightning size={20} weight="duotone" className="text-green-500" />
                  控制能力
                </CardTitle>
                <CardDescription>
                  执行和管理平台功能
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {controlCapabilities.map((cap) => (
                  <CapabilityCard
                    key={cap.id}
                    capability={cap}
                    onToggle={toggleCapability}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Memory card with delete button
interface MemoryCardWithDeleteProps {
  memory: AIMemoryItem;
  onDelete: () => void;
}

function MemoryCardWithDelete({ memory, onDelete }: MemoryCardWithDeleteProps) {
  return (
    <Card className={`${getMemoryTypeColor(memory.type)} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {getMemoryTypeLabel(memory.type)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                置信度: {Math.round(memory.confidence * 100)}%
              </span>
            </div>
            <div className="font-medium text-sm">{memory.key}</div>
            <div className="text-sm text-muted-foreground mt-1">{memory.value}</div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Brain size={20} weight="duotone" className="text-purple-500" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash size={14} weight="bold" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>使用 {memory.usageCount} 次</span>
          <span>学习于 {formatTimeAgo(memory.learnedAt)}</span>
        </div>
        <Progress value={memory.confidence * 100} className="h-1 mt-2" />
      </CardContent>
    </Card>
  );
}

