import {ProfileInfoForm} from './ProfileInfoForm';
import {PhoneNumberForm} from './PhoneNumberForm';
import {EmailManagement} from './EmailManagement';
import {ConnectedAccounts} from './ConnectedAccounts';
import {VerificationStatus} from './VerificationStatus';
import {PasswordForm} from './PasswordForm';
import {SessionsList} from './SessionsList';
import {DeleteAccountSection} from './DeleteAccountSection';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '~/components/ui/tabs';
import {User, ShieldCheck, Lock} from 'lucide-react';
import {NODE_ENV} from '~/config/env';

export function ConfiguracionPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Configuración</h1>
        <p className='text-muted-foreground mt-2'>
          Administrá tu cuenta, seguridad y preferencias.
        </p>
      </div>

      <Tabs defaultValue='personal' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='personal' className='flex items-center gap-2'>
            <User className='h-4 w-4' />
            <span className='hidden sm:inline'>Información personal</span>
            <span className='sm:hidden'>Personal</span>
          </TabsTrigger>
          <TabsTrigger value='verification' className='flex items-center gap-2'>
            <ShieldCheck className='h-4 w-4' />
            <span className='hidden sm:inline'>Verificación</span>
            <span className='sm:hidden'>Verificar</span>
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center gap-2'>
            <Lock className='h-4 w-4' />
            <span>Seguridad</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='personal' className='space-y-6 mt-6'>
          <div>
            <h2 className='text-xl font-semibold'>Información personal</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Actualizá tus datos personales, teléfono y direcciones de correo.
            </p>
          </div>

          <ProfileInfoForm />
          {NODE_ENV !== 'production' && <PhoneNumberForm />}
          <EmailManagement />
          <ConnectedAccounts />
        </TabsContent>

        <TabsContent value='verification' className='space-y-6 mt-6'>
          <div>
            <h2 className='text-xl font-semibold'>Verificación de identidad</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Verificá tu identidad para poder publicar entradas en Revendiste.
            </p>
          </div>

          <VerificationStatus />
        </TabsContent>

        <TabsContent value='security' className='space-y-6 mt-6'>
          <div>
            <h2 className='text-xl font-semibold'>Seguridad de la cuenta</h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Gestioná tu contraseña, sesiones activas y configuración de
              seguridad.
            </p>
          </div>

          <PasswordForm />
          <SessionsList />
          <DeleteAccountSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
