import {useState} from 'react';
import {useFormContext} from 'react-hook-form';
import {Button} from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import {FileDropzone} from '~/components/FileDropzone';
import {DocumentCropper} from '~/components/DocumentCropper';
import type {VerificationFormValues} from '../IdentityVerificationFlow';

interface DocumentsStepProps {
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
}

export function DocumentsStep({
  onSubmit,
  onBack,
  isPending,
}: DocumentsStepProps) {
  const form = useFormContext<VerificationFormValues>();
  // Track the raw file for cropping (before crop)
  const [rawFile, setRawFile] = useState<File | null>(null);
  // Track if we're in cropping mode
  const [isCropping, setIsCropping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate only the document field for this step
    const isValid = await form.trigger('document');
    const document = form.getValues('document');
    if (isValid && document && document.length > 0) {
      onSubmit();
    } else if (!document || document.length === 0) {
      form.setError('document', {
        type: 'manual',
        message: 'La foto del documento es requerida',
      });
    }
  };

  // Create a FileList-like object from a single File
  const createFileList = (file: File): FileList => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
  };

  // When user selects a file, show the cropper
  const handleFileSelect = (file: File) => {
    setRawFile(file);
    setIsCropping(true);
  };

  // When user confirms the crop
  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to File with proper name and type
    const croppedFile = new File([croppedBlob], 'document-cropped.jpg', {
      type: 'image/jpeg',
    });
    // Set the cropped file as the form value
    form.setValue('document', createFileList(croppedFile), {
      shouldValidate: true,
    });
    setIsCropping(false);
    setRawFile(null);
  };

  // When user cancels cropping
  const handleCropCancel = () => {
    setIsCropping(false);
    setRawFile(null);
  };

  // If we're in cropping mode, show the cropper
  if (isCropping && rawFile) {
    return (
      <DocumentCropper
        image={rawFile}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        isLoading={isPending}
      />
    );
  }

  // Get the cropped file from form (if exists)
  // Use watch() instead of getValues() to trigger re-render when the value changes
  const document = form.watch('document');
  const croppedFile =
    document instanceof FileList && document.length > 0 ? document[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Documento</CardTitle>
        <CardDescription>
          Sube una foto clara del frente de tu documento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="document"
            render={({fieldState}) => {
              return (
                <FormItem>
                  <FormLabel>Foto del Documento</FormLabel>
                  <FileDropzone
                    onFileSelect={handleFileSelect}
                    selectedFile={croppedFile}
                    displayFileName="Documento recortado"
                    onClear={() => {
                      form.setValue('document', undefined);
                      setRawFile(null);
                    }}
                    accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
                    acceptedMimeTypes={[
                      'image/jpeg',
                      'image/jpg',
                      'image/png',
                      'image/webp',
                      'image/heic',
                      'image/heif',
                    ]}
                    maxFileSize={10 * 1024 * 1024}
                    helperText="Asegúrate de que la foto sea clara y que tu rostro sea visible en el documento"
                    error={fieldState.error?.message}
                  />
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onBack}
              disabled={isPending}
            >
              Volver
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || form.formState.isSubmitting}
            >
              {isPending ? 'Verificando...' : 'Continuar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
