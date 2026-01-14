import {mutationOptions} from '@tanstack/react-query';
import {api} from '../index';
import {DocumentTypeEnum} from '@revendiste/shared';

interface VerifyDocumentParams {
  file: File;
  documentType: 'ci_uy' | 'dni_ar' | 'passport';
}

/**
 * Upload and verify an identity document.
 * Uses the generated API which now properly includes documentType.
 */
export async function verifyIdentityDocument({
  file,
  documentType,
}: VerifyDocumentParams) {
  return api.identityVerification
    .verifyDocument(
      {file, documentType},
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    .then(res => res.data);
}
