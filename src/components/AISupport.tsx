import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, X, Maximize2, Minimize2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
    
    // Universal Logs section
    if (lowerMessage.includes('universal') || lowerMessage.includes('no1logs') || lowerMessage.includes('api log')) {
      return 'Universal Logs is our premium section featuring products directly from the No1Logs API! 🌐\n\n✓ Wide variety of social media accounts\n✓ Real-time stock and pricing\n✓ Direct API ordering\n✓ Instant delivery after purchase\n\nBrowse Universal Logs from the menu to explore thousands of verified accounts across multiple platforms!';
    }
    
    // Wallet and funding
    if (lowerMessage.includes('wallet') || lowerMessage.includes('fund') || lowerMessage.includes('balance')) {
      return 'You can fund your wallet through two methods:\n\n1. Automatic Payment (Etegram): Fast and instant crediting\n2. Manual Payment: Contact support via WhatsApp\n\nGo to the Fund Wallet page and select your preferred method. For manual payments, your wallet will be credited within 5-10 minutes after verification.';
    }
    
    // Orders and purchases
    if (lowerMessage.includes('order') || lowerMessage.includes('purchase') || lowerMessage.includes('buy')) {
      return 'We offer two ways to purchase:\n\n📦 Dashboard Logs: Browse categorized logs, add to cart, and checkout\n🌐 Universal Logs: Order directly from our API partner with instant delivery\n\nAfter purchase, view your orders in the Order Details section. Universal Logs orders show the account details delivered directly from the API!';
    }
    
    // Account and log details
    if (lowerMessage.includes('account') || lowerMessage.includes('log') || lowerMessage.includes('detail')) {
      return 'After purchasing logs, you\'ll find complete account details in your Order Details section:\n\n✓ Dashboard orders: View purchased log credentials\n✓ Universal Logs orders: See API-delivered account data\n\nAll accounts are tested and verified before delivery. You can download order details as a text file.';
    }
    
    // Payment options
    if (lowerMessage.includes('payment') || lowerMessage.includes('bank') || lowerMessage.includes('transfer') || lowerMessage.includes('etegram')) {
      return 'Payment Options:\n\n1. Etegram (Automatic): Instant crediting with virtual account\n2. Manual Transfer:\n   - Account: 5567602066\n   - Name: EJEMEGWA CHUKWUJEKWU PETER\n   - Bank: MONIEPOINT MFB\n\nFor manual payments, contact us via WhatsApp with your receipt and email: https://wa.link/8rqbox';
    }
    
    // Support and contact
    if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact') || lowerMessage.includes('email')) {
      return 'Need assistance? Contact us:\n\n📧 Email: info.loghubmarketplace@gmail.com\n💬 WhatsApp: https://wa.link/8rqbox\n\nOur support team helps with payments, technical issues, account problems, and Universal Logs questions.';
    }
    
    // Categories and platforms
    if (lowerMessage.includes('category') || lowerMessage.includes('type') || lowerMessage.includes('social') || lowerMessage.includes('platform')) {
      return 'We offer logs for many platforms:\n\n📱 Dashboard Categories:\n- Facebook, Instagram, Twitter, TikTok\n- Texting Apps, Rare Social Media\n\n🌐 Universal Logs (API):\n- Thousands of additional products\n- USA/Africa/Europe Facebook accounts\n- Gmail, Twitter, Instagram accounts\n- And much more!\n\nAll accounts are verified and ready for immediate use.';
    }

    // Pricing
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('cheap') || lowerMessage.includes('expensive')) {
      return 'Our pricing varies by platform and account type:\n\n📦 Dashboard Logs: Competitive fixed prices\n🌐 Universal Logs: Dynamic API pricing\n\nAll prices are displayed in Nigerian Naira (₦). Browse both sections to compare and find the best deals!';
    }

    // Security and trust
    if (lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('trust') || lowerMessage.includes('legit')) {
      return 'Your security is our priority:\n\n✓ All accounts tested before listing\n✓ Personal data encrypted\n✓ Secure payment systems\n✓ AI-powered customer support\n✓ WhatsApp support available\n✓ Verified account credentials\n\nWe guarantee account quality and provide full support for any issues.';
    }

    // Problems and issues
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('error') || lowerMessage.includes('not working')) {
      return 'I\'m sorry you\'re experiencing issues. For technical problems:\n\n1. Try refreshing the page\n2. Check your wallet balance\n3. Ensure you\'re logged in\n\nFor persistent issues, contact our support team:\n📧 Email: info.loghubmarketplace@gmail.com\n💬 WhatsApp: https://wa.link/8rqbox';
    }

    // Default responses
    const defaultResponses = [
      'I\'m here to help! Ask me about:\n\n• Wallet funding & balance\n• Dashboard & Universal Logs\n• Orders & account details\n• Payment methods\n• Platform categories\n\nOr contact support: info.loghubmarketplace@gmail.com',
      'Thanks for reaching out! I can help with wallet funding, purchases, Universal Logs, orders, and more. For complex issues, reach us at info.loghubmarketplace@gmail.com or WhatsApp: https://wa.link/8rqbox',
      'How can I assist you today? I know all about Log Hub\'s features including our new Universal Logs section with direct API ordering! Ask away or contact support for personalized help.'
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
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 h-9 px-3 py-1 text-sm rounded-md border border-input bg-transparent shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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