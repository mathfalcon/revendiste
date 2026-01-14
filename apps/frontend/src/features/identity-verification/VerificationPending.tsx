import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import {ShieldCheck, FileText, Lock} from 'lucide-react';
import {IdentityVerificationFlow} from './IdentityVerificationFlow';

interface ExistingDocumentInfo {
  documentType: 'ci_uy' | 'dni_ar' | 'passport';
  documentNumber: string;
  documentCountry?: string;
}

interface VerificationPendingProps {
  onComplete: () => void;
  existingDocumentInfo?: ExistingDocumentInfo;
  /** Whether user has already uploaded their document (step 2 completed) */
  hasDocumentImage?: boolean;
  /** Whether document verification step was completed successfully */
  documentVerificationCompleted?: boolean;
  /** Existing liveness session ID for resuming on different device */
  verificationSessionId?: string | null;
  /** Current verification status from user data */
  verificationStatus?:
    | 'pending'
    | 'completed'
    | 'requires_manual_review'
    | 'failed'
    | 'rejected'
    | null;
  /** Number of verification attempts used */
  verificationAttempts?: number;
  /** Whether user can retry liveness */
  canRetryLiveness?: boolean;
}

export function VerificationPending({
  onComplete,
  existingDocumentInfo,
  hasDocumentImage,
  documentVerificationCompleted,
  verificationSessionId,
  verificationStatus,
  verificationAttempts,
  canRetryLiveness,
}: VerificationPendingProps) {
  return (
    <div className='container mx-auto max-w-2xl px-4 py-8'>
      {/* Header */}
      <div className='text-center mb-8'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
          <ShieldCheck className='h-8 w-8 text-primary' />
        </div>
        <h1 className='text-2xl font-bold mb-2'>Verificá tu identidad</h1>
        <p className='text-muted-foreground'>
          Para poder publicar entradas en Revendiste, necesitamos verificar tu
          identidad. Este proceso es rápido y seguro.
        </p>
      </div>

      {/* Accordion with detailed info */}
      <Accordion type='single' collapsible className='mb-6'>
        <AccordionItem value='steps'>
          <AccordionTrigger className='text-sm'>
            <span className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              ¿Cómo funciona el proceso?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <VerificationSteps />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='security'>
          <AccordionTrigger className='text-sm'>
            <span className='flex items-center gap-2'>
              <Lock className='h-4 w-4' />
              ¿Cómo protegemos tus datos?
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <SecurityInfo />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <IdentityVerificationFlow
        onComplete={onComplete}
        existingDocumentInfo={existingDocumentInfo}
        hasDocumentImage={hasDocumentImage}
        documentVerificationCompleted={documentVerificationCompleted}
        verificationSessionId={verificationSessionId}
        verificationStatus={verificationStatus}
        verificationAttempts={verificationAttempts}
        canRetryLiveness={canRetryLiveness}
      />
    </div>
  );
}

function VerificationSteps() {
  const steps = [
    {
      number: 1,
      title: 'Información del documento',
      description:
        'Ingresá tu número de documento (CI Uruguay, DNI Argentina o Pasaporte)',
    },
    {
      number: 2,
      title: 'Foto del documento',
      description: 'Sacá una foto clara de tu documento de identidad',
    },
    {
      number: 3,
      title: 'Verificación de identidad',
      description:
        'Completá una breve verificación con tu cámara para confirmar que sos vos',
    },
  ];

  return (
    <div className='space-y-4 pt-2'>
      {steps.map(step => (
        <div key={step.number} className='flex gap-3'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium'>
            {step.number}
          </div>
          <div>
            <p className='font-medium'>{step.title}</p>
            <p className='text-sm text-muted-foreground'>{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityInfo() {
  const securityPoints = [
    {
      title: 'Datos cifrados:',
      description:
        'Las imágenes de tu documento se guardan con cifrado AES-256, el mismo estándar que usan bancos y entidades financieras.',
    },
    {
      title: 'Acceso restringido:',
      description:
        'Solo personal autorizado puede acceder a tus imágenes en casos excepcionales de revisión de seguridad.',
    },
    {
      title: 'Almacenamiento seguro:',
      description:
        'Tus imágenes se guardan en servidores seguros con acceso controlado y solo se usan para verificar tu identidad.',
    },
    {
      title: 'Cumplimiento legal:',
      description:
        'Procesamos tus datos conforme a la Ley Nº 18.331 de Protección de Datos Personales de Uruguay.',
    },
  ];

  return (
    <div className='space-y-3 pt-2 text-sm text-muted-foreground'>
      {securityPoints.map((point, index) => (
        <div key={index} className='flex gap-2'>
          <ShieldCheck className='h-4 w-4 shrink-0 text-green-600 mt-0.5' />
          <p>
            <strong className='text-foreground'>{point.title}</strong>{' '}
            {point.description}
          </p>
        </div>
      ))}
    </div>
  );
}
