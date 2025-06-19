'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { saveCredentialId, saveWebAuthnPublicKey } from '@/app/supabase/mutations';
import { useRouter } from 'next-nprogress-bar';
import { toast } from 'sonner';
import Link from 'next/link';

export default function BiometricRegister() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // This prepares a browser challenge and makes a public key with challange, user and keycardparams
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: {
          name: 'ZK Password Manager'
        },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: email
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7 // ES256
          }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000,
        attestation: 'none' as AttestationConveyancePreference
      };

      // This then proceedes to start WebAuthn registration
      const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;

      if (!credential){
        toast.error('Biometric registration failed');
        throw new Error('Biometric registration failed.');
      } 

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

      // Then it saves credentials ID to Supabase
      const saveCredntials = await saveCredentialId(credentialId, email)

      const saveAuthnKey = await saveWebAuthnPublicKey(credential, email)

      if (!saveCredntials) throw new Error('Failed to save biometric ID.');
      if (!saveAuthnKey) throw new Error('Failed to save webauthn public key ID.');

      toast.success('Biometric registration successful! ✅', {
        duration: 2000, 
      });

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 2500); 

    } catch (err: any) {
      console.error('Biometric registration error:', err);
      toast.error(err.message || 'Failed to register biometrics', {
        duration: 3000 
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center">Biometric Registration</h2>

        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">Biometric registered successfully!</div>}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}      
          >
            {loading ? <LoadingSpinner /> : 'Register Biometric'}
          </button>
          <p className="text-gray-600 text-center mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500 hover:underline cursor-pointer"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
