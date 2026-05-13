import {createFileRoute, Link, useNavigate} from '@tanstack/react-router';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {Card, CardContent} from '~/components/ui/card';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {z} from 'zod';
import {useEffect, useMemo, useRef, useState} from 'react';
import {cn} from '~/lib/utils';
import {alternateHreflangEsUy, seo} from '~/utils/seo';
import {getBaseUrl} from '~/config/env';
import {
  faqGeneral,
  faqPagos,
  faqSections,
  getAllFaqItemsForSchema,
  getFaqCompradores,
  getFaqVendedores,
  type FAQItem,
  type FAQSection,
} from '~/content/faq-items';
import {
  HelpCircle,
  ShoppingCart,
  Tag,
  CreditCard,
  Search,
  Mail,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

const faqSearchSchema = z.object({
  seccion: z.enum(faqSections).optional().catch(undefined),
  pregunta: z.coerce.number().int().min(0).optional().catch(undefined),
});

export const Route = createFileRoute('/preguntas-frecuentes')({
  component: FAQPage,
  validateSearch: faqSearchSchema,
  head: () => {
    const baseUrl = getBaseUrl();

    const allFaqItems = getAllFaqItemsForSchema();
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    return {
      meta: seo({
        title: 'Preguntas Frecuentes | Revendiste - Compra y venta de entradas',
        description:
          'Dudas sobre cómo comprar o vender entradas en Revendiste? Acá te explicamos todo: comisiones, pagos, plazos de entrega, garantías y más.',
        baseUrl,
      }),
      links: [
        alternateHreflangEsUy(`${baseUrl}/preguntas-frecuentes`),
        {rel: 'canonical', href: `${baseUrl}/preguntas-frecuentes`},
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(faqSchema),
        },
      ],
    };
  },
});

function getSectionConfig(): Record<
  FAQSection,
  {label: string; icon: typeof HelpCircle; items: FAQItem[]}
> {
  return {
    general: {label: 'General', icon: HelpCircle, items: faqGeneral},
    compradores: {
      label: 'Compradores',
      icon: ShoppingCart,
      items: getFaqCompradores(),
    },
    publicadores: {
      label: 'Publicadores',
      icon: Tag,
      items: getFaqVendedores(),
    },
    pagos: {label: 'Pagos', icon: CreditCard, items: faqPagos},
  };
}

interface FAQSectionProps {
  items: FAQItem[];
  openItem?: number;
  highlightedItem?: number;
  onOpenChange?: (index: number | undefined) => void;
}

function FAQSectionAccordion({
  items,
  openItem,
  highlightedItem,
  onOpenChange,
}: FAQSectionProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (highlightedItem !== undefined && itemRefs.current[highlightedItem]) {
      setTimeout(() => {
        itemRefs.current[highlightedItem]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [highlightedItem]);

  return (
    <Accordion
      type='single'
      collapsible
      className='w-full space-y-2'
      value={openItem !== undefined ? `item-${openItem}` : undefined}
      onValueChange={value => {
        if (onOpenChange) {
          const index = value
            ? parseInt(value.replace('item-', ''), 10)
            : undefined;
          onOpenChange(index);
        }
      }}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          ref={el => {
            itemRefs.current[index] = el;
          }}
          className={cn(
            'rounded-lg border bg-card px-4 transition-all duration-300',
            'hover:shadow-sm hover:border-primary/20',
            'data-[state=open]:shadow-sm data-[state=open]:border-primary/30',
            highlightedItem === index &&
              'bg-primary/5 ring-2 ring-primary/20 border-primary/30',
          )}
        >
          <AccordionTrigger className='text-left py-4 text-[15px] font-medium hover:no-underline'>
            {item.question}
          </AccordionTrigger>
          <AccordionContent className='text-muted-foreground leading-relaxed pb-4 text-sm'>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function FAQPage() {
  const {seccion, pregunta} = Route.useSearch();
  const navigate = useNavigate({from: Route.fullPath});
  const [searchQuery, setSearchQuery] = useState('');

  const sectionConfig = useMemo(() => getSectionConfig(), []);

  const activeTab = seccion ?? 'general';

  const activeItems = sectionConfig[activeTab].items;
  const validPregunta =
    pregunta !== undefined && pregunta >= 0 && pregunta < activeItems.length
      ? pregunta
      : undefined;

  const [openItem, setOpenItem] = useState<number | undefined>(validPregunta);

  useEffect(() => {
    setOpenItem(validPregunta);
  }, [validPregunta]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const query = normalize(searchQuery);
    const results: {section: FAQSection; items: FAQItem[]}[] = [];

    for (const [key, config] of Object.entries(sectionConfig)) {
      const matched = config.items.filter(
        item =>
          normalize(item.question).includes(query) ||
          normalize(item.answer).includes(query),
      );
      if (matched.length > 0) {
        results.push({section: key as FAQSection, items: matched});
      }
    }

    return results;
  }, [searchQuery, sectionConfig]);

  const handleTabChange = (value: string) => {
    setSearchQuery('');
    setOpenItem(undefined);
    navigate({
      search: prev => ({
        ...prev,
        seccion: value as FAQSection,
        pregunta: undefined,
      }),
      replace: true,
    });
  };

  const handleQuestionChange = (index: number | undefined) => {
    setOpenItem(index);
    navigate({
      search: prev => ({
        ...prev,
        pregunta: index,
      }),
      replace: true,
    });
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className='min-h-screen bg-background-secondary'>
      <div className='container mx-auto max-w-4xl px-4 py-8 md:py-16'>
        <div className='text-center mb-8 md:mb-12'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4'>
            <MessageCircle className='w-7 h-7 text-primary' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold tracking-tight mb-3'>
            Preguntas Frecuentes
          </h1>
          <p className='text-muted-foreground max-w-xl mx-auto text-balance'>
            Encontrá respuestas a las dudas más comunes sobre Revendiste. Si
            necesitás ayuda adicional, escribinos a{' '}
            <a
              href='mailto:ayuda@revendiste.com'
              className='text-primary hover:underline font-medium'
            >
              ayuda@revendiste.com
            </a>
          </p>
        </div>

        <div className='relative mb-6'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Buscá tu pregunta...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10 h-11 bg-card'
          />
        </div>

        {isSearching ? (
          <div className='space-y-6'>
            {filteredResults && filteredResults.length > 0 ? (
              filteredResults.map(({section, items}) => {
                const config = sectionConfig[section];
                const Icon = config.icon;
                return (
                  <div key={section}>
                    <div className='flex items-center gap-2 mb-3'>
                      <Icon className='w-4 h-4 text-muted-foreground' />
                      <h3 className='text-sm font-medium text-muted-foreground'>
                        {config.label}
                      </h3>
                    </div>
                    <FAQSectionAccordion items={items} />
                  </div>
                );
              })
            ) : (
              <Card>
                <CardContent className='py-12 text-center'>
                  <Search className='w-10 h-10 text-muted-foreground/40 mx-auto mb-3' />
                  <p className='text-muted-foreground font-medium'>
                    No encontramos resultados para &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className='text-muted-foreground/70 text-sm mt-1'>
                    Probá con otras palabras o escribinos a{' '}
                    <a
                      href='mailto:ayuda@revendiste.com'
                      className='text-primary hover:underline'
                    >
                      ayuda@revendiste.com
                    </a>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className='overflow-hidden'>
            <CardContent className='p-0'>
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className='w-full'
              >
                <div className='border-b bg-muted/30 p-2 md:p-3'>
                  <TabsList className='grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1.5 bg-transparent'>
                    {faqSections.map(section => {
                      const config = sectionConfig[section];
                      const Icon = config.icon;
                      return (
                        <TabsTrigger
                          key={section}
                          value={section}
                          className={cn(
                            'flex items-center gap-1.5 py-2.5 px-3 text-xs md:text-sm rounded-lg transition-all',
                            'data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground',
                            'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-card/50',
                          )}
                        >
                          <Icon className='w-4 h-4 shrink-0' />
                          <span>{config.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                <div className='p-4 md:p-6'>
                  {faqSections.map(section => (
                    <TabsContent key={section} value={section} className='mt-0'>
                      <FAQSectionAccordion
                        items={sectionConfig[section].items}
                        openItem={activeTab === section ? openItem : undefined}
                        highlightedItem={
                          activeTab === section ? validPregunta : undefined
                        }
                        onOpenChange={handleQuestionChange}
                      />
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <Card className='mt-8 border-primary/10 bg-linear-to-br from-primary/5 via-card to-card overflow-hidden'>
          <CardContent className='py-8 px-6 md:px-8'>
            <div className='flex flex-col md:flex-row items-center gap-6 md:gap-8'>
              <div className='flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0'>
                <Mail className='w-6 h-6 text-primary' />
              </div>
              <div className='text-center md:text-left flex-1'>
                <h2 className='font-semibold text-lg mb-1'>
                  ¿No encontraste lo que buscabas?
                </h2>
                <p className='text-muted-foreground text-sm'>
                  Escribinos y te respondemos a la brevedad. Estamos para
                  ayudarte.
                </p>
              </div>
              <Button asChild size='lg' className='shrink-0 group'>
                <Link to='/contacto'>
                  Contactanos
                  <ArrowRight className='w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5' />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
