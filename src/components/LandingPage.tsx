import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Users, 
  Zap, 
  BarChart3, 
  Shield, 
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Smartphone,
  Target,
  TrendingUp
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  const features = [
    {
      icon: MessageSquare,
      title: "Campanhas Automatizadas",
      description: "Crie e execute campanhas de WhatsApp de forma automatizada com agendamento inteligente."
    },
    {
      icon: Users,
      title: "Gestão de Contatos",
      description: "Organize seus contatos em grupos e segmente sua audiência para campanhas mais efetivas."
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Acompanhe métricas detalhadas de suas campanhas em tempo real com relatórios completos."
    },
    {
      icon: Zap,
      title: "Integração Evolution API",
      description: "Conecte-se facilmente com a Evolution API para envio seguro e confiável de mensagens."
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados e campanhas protegidos com criptografia de ponta a ponta."
    },
    {
      icon: Clock,
      title: "Agendamento Inteligente",
      description: "Programe suas campanhas para o momento ideal e maximize o engajamento."
    }
  ];

  const pricing = [
    {
      name: "Básico",
      price: "R$ 49",
      period: "/mês",
      description: "Ideal para pequenos negócios",
      features: [
        "Até 1.000 contatos",
        "5 campanhas por mês",
        "1 instância WhatsApp",
        "Relatórios básicos",
        "Suporte por email"
      ],
      popular: false
    },
    {
      name: "Profissional",
      price: "R$ 149",
      period: "/mês",
      description: "Para empresas em crescimento",
      features: [
        "Até 10.000 contatos",
        "Campanhas ilimitadas",
        "5 instâncias WhatsApp",
        "Analytics avançado",
        "Suporte prioritário",
        "API personalizada"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$ 399",
      period: "/mês",
      description: "Para grandes empresas",
      features: [
        "Contatos ilimitados",
        "Campanhas ilimitadas",
        "Instâncias ilimitadas",
        "White label completo",
        "Suporte 24/7",
        "Integração personalizada",
        "Gerente de conta dedicado"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      company: "TechStart",
      text: "Aumentamos nossa conversão em 300% com as campanhas automatizadas do WhatsApp Pulse.",
      stars: 5
    },
    {
      name: "Ana Paula",
      company: "Marketing Digital",
      text: "A plataforma é intuitiva e os resultados são impressionantes. Recomendo para qualquer empresa.",
      stars: 5
    },
    {
      name: "João Santos",
      company: "E-commerce Plus",
      text: "Conseguimos recuperar 40% mais clientes inativos com as campanhas segmentadas.",
      stars: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">WhatsApp Pulse</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onLogin}>
              Entrar
            </Button>
            <Button onClick={onGetStarted}>
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            🚀 Nova versão disponível
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Transforme seu
            <span className="text-blue-600"> WhatsApp</span>
            <br />
            em uma máquina de vendas
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatize campanhas, gerencie contatos e aumente suas conversões com a plataforma 
            mais completa para marketing no WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6" onClick={onGetStarted}>
              Começar Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Ver Demo
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Teste grátis por 14 dias
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Sem cartão de crédito
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ferramentas poderosas e intuitivas para maximizar o potencial do seu WhatsApp Business
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-200">Empresas Ativas</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50M+</div>
              <div className="text-blue-200">Mensagens Enviadas</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-200">Taxa de Entrega</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">300%</div>
              <div className="text-blue-200">Aumento na Conversão</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planos que crescem com seu negócio
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 border-2' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <Button 
                    className="w-full mt-6" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={onGetStarted}
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent>
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para turbinar suas vendas?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que já transformaram seus resultados com o WhatsApp Pulse
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={onGetStarted}>
              Começar Grátis Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 text-white border-white hover:bg-white hover:text-blue-600">
              Falar com Vendas
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">WhatsApp Pulse</span>
              </div>
              <p className="text-gray-400">
                A plataforma mais completa para marketing e vendas no WhatsApp.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Recursos</li>
                <li>Preços</li>
                <li>API</li>
                <li>Integrações</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre nós</li>
                <li>Blog</li>
                <li>Carreiras</li>
                <li>Contato</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Central de ajuda</li>
                <li>Documentação</li>
                <li>Status</li>
                <li>Comunidade</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WhatsApp Pulse. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}