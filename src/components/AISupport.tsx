import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, X, Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const AISupport: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m Log Hub AI, your personal assistant. I\'m here to help you with any questions about our platform, purchasing logs, managing your wallet, or anything else you need. How can I assist you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Knowledge base responses
    if (lowerMessage.includes('wallet') || lowerMessage.includes('fund') || lowerMessage.includes('balance')) {
      return 'You can fund your wallet through our manual payment system. Go to the Fund Wallet page, enter your desired amount, and follow the bank transfer instructions. After payment, send your receipt via WhatsApp and your wallet will be credited within 5-10 minutes.';
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('purchase') || lowerMessage.includes('buy')) {
      return 'To make a purchase: 1) Browse logs on the Dashboard, 2) Add items to your cart, 3) Ensure you have sufficient wallet balance, 4) Complete checkout. After purchase, you\'ll receive detailed account information in your Orders section.';
    }
    
    if (lowerMessage.includes('account') || lowerMessage.includes('log') || lowerMessage.includes('detail')) {
      return 'After purchasing logs, you\'ll find the complete account details (usernames, passwords, etc.) in your Orders section under Order Details. Each log contains verified accounts ready for immediate use.';
    }
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('bank') || lowerMessage.includes('transfer')) {
      return 'We currently accept manual bank transfers. Use these details: Account: 5567602066, Name: EJEMEGWA CHUKWUJEKWU PETER, Bank: MONIEPOINT MFB. After payment, contact us via WhatsApp with your receipt and email for quick processing.';
    }
    
    if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
      return 'For additional support, you can contact us via WhatsApp at https://wa.link/8rqbox. Our team is available to help with payments, technical issues, and any other questions you may have.';
    }
    
    if (lowerMessage.includes('category') || lowerMessage.includes('type') || lowerMessage.includes('social')) {
      return 'We offer logs for various platforms including social media accounts, streaming services, and more. Browse by category on the Dashboard to find exactly what you need. All accounts are verified and ready to use.';
    }

    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('cheap')) {
      return 'Our log prices vary by platform and account type. You can see the current pricing on each log in the Dashboard. We offer competitive rates and frequently update our inventory with fresh accounts.';
    }

    if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('trust')) {
      return 'Your security is our priority. All accounts are tested before listing, your personal data is encrypted, and our payment system is secure. We also provide customer support for any issues you may encounter.';
    }

    // Default responses
    const defaultResponses = [
      'I understand you need help with that. Could you please provide more specific details about what you\'re looking for? I can assist with wallet funding, purchasing logs, order details, or platform navigation.',
      'I\'m here to help! Can you tell me more about what you\'d like to know? Whether it\'s about our services, payment process, or account management, I\'ll provide you with the information you need.',
      'Thanks for reaching out! For the best assistance, could you specify whether you need help with: funding your wallet, making purchases, accessing order details, or something else?'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputMessage),
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // 1-3 seconds delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Floating chat button
  const ChatButton = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );

  // Chat interface
  const ChatInterface = () => (
    <Card className={`h-full flex flex-col ${isExpanded ? 'min-h-[600px]' : 'h-[500px]'}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Log Hub AI</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online - Ready to help
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea 
          className="flex-1 pr-4 mb-4" 
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 opacity-70 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && <ChatButton />}

      {/* Chat dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`${isExpanded ? 'max-w-4xl h-[80vh]' : 'max-w-md h-[600px]'} p-0`}>
          <ChatInterface />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AISupport;