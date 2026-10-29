import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Keyboard, ScanLine, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../types';

type Props = {
  user: User | null;
  notify: (message: string) => void;
};

type ValidationResult = {
  code_billet: string;
  titre: string;
  client: string;
  date_heure: string;
  valide_le: string;
};

type Detector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type DetectorConstructor = new (options: { formats: string[] }) => Detector;

export default function TicketValidationPage({ user, notify }: Props) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const scanningRef = useRef(false);
  const [code, setCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'gestionnaire') navigate('/');
    return () => stopCamera();
  }, [user, navigate]);

  function stopCamera() {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setCameraActive(false);
  }

  async function scan() {
    if (!detectorRef.current || !videoRef.current || !scanningRef.current) return;
    try {
      const detected = await detectorRef.current.detect(videoRef.current);
      const value = detected[0]?.rawValue?.trim();
      if (value) {
        setCode(value);
        stopCamera();
        await validate(value);
        return;
      }
    } catch {
      setCameraError('La lecture du QR code a échoué. Saisissez le code manuellement.');
      stopCamera();
      return;
    }
    window.requestAnimationFrame(() => void scan());
  }

  async function startCamera() {
    setCameraError('');
    const BarcodeDetector = (window as Window & {
      BarcodeDetector?: DetectorConstructor;
    }).BarcodeDetector;
    if (!BarcodeDetector) {
      setCameraError('La lecture QR n’est pas prise en charge par ce navigateur. Saisissez le code manuellement.');
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
      scanningRef.current = true;
      setCameraActive(true);
      void scan();
    } catch {
      stopCamera();
      setCameraError('Impossible d’accéder à la caméra. Vérifiez la permission ou saisissez le code manuellement.');
    }
  }

  async function validate(value = code) {
    setValidating(true);
    setError('');
    setResult(null);
    try {
      const response = await api<{ billet: ValidationResult }>(
        '/api/gestion/validation-billet',
        { method: 'POST', body: JSON.stringify({ codeBillet: value }) }
      );
      setResult(response.billet);
      setCode(response.billet.code_billet);
      notify('Billet validé : entrée autorisée.');
    } catch (validationError) {
      setError((validationError as Error).message);
    } finally {
      setValidating(false);
    }
  }

  if (!user || user.role !== 'gestionnaire') return null;

  return (
    <section className="ticket-validation-page">
      <div className="eyebrow"><span className="eyebrow-line" />ACCÈS GESTIONNAIRE</div>
      <div className="validation-heading">
        <div>
          <h1>Valider un billet</h1>
          <p>Scannez le QR code à l’entrée pour autoriser ou refuser l’accès.</p>
        </div>
        <button className="button button-outline" onClick={() => navigate('/gestion')}>
          Retour au dashboard
        </button>
      </div>

      <div className="validation-layout">
        <div className="validation-scanner">
          <div className="scanner-frame">
            <video ref={videoRef} muted playsInline aria-label="Caméra de lecture du QR code" />
            {!cameraActive && <ScanLine size={48} />}
          </div>
          <div className="validation-actions">
            {!cameraActive ? (
              <button className="button button-gold" onClick={() => void startCamera()}>
                <Camera size={17} /> Ouvrir la caméra
              </button>
            ) : (
              <button className="button button-outline" onClick={stopCamera}>Arrêter la caméra</button>
            )}
          </div>
          {cameraError && <p className="form-error">{cameraError}</p>}
        </div>

        <form className="validation-form" onSubmit={(event) => { event.preventDefault(); void validate(); }}>
          <label htmlFor="ticket-code"><Keyboard size={17} /> Ou saisir le code du billet</label>
          <input
            id="ticket-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="PT-XXXXXXXX"
            pattern="PT-[A-F0-9]{8}"
            required
          />
          <button className="button button-gold" type="submit" disabled={validating || !code.trim()}>
            {validating ? 'Validation…' : 'Valider le billet'}
          </button>
          {error && <div className="validation-feedback invalid"><XCircle size={22} /><span>{error}</span></div>}
          {result && (
            <div className="validation-feedback valid">
              <CheckCircle2 size={22} />
              <div><strong>Entrée autorisée</strong><span>{result.client} · {result.titre}</span><small>{result.code_billet}</small></div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
