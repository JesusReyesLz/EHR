/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

const HAS_STRIPE_KEY = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = HAS_STRIPE_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string) : null;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onSuccess: () => void;
}

const MockCheckout: React.FC<{ amount: number, description: string, onSuccess: () => void, onClose: () => void }> = ({ amount, description, onSuccess, onClose }) => {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }, 1000);
  };

  const handleBypass = () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 500);
  };

  if (success) {
    return (
      <div className="text-center py-8 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">¡Pago Exitoso!</h3>
        <p className="text-slate-500 font-medium">Bypass de pago completado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-inner">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest">A Pagar</span>
          <span className="text-2xl font-black text-emerald-600">${amount.toFixed(2)} MXN</span>
        </div>
        <p className="text-xs text-emerald-700 font-medium">{description}</p>
        <div className="mt-4 p-3 bg-white/50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 border-dashed text-center">
          💰 Modo de Pruebas Activo — El pago será 100% gratuito.
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <button 
          onClick={handleBypass} 
          disabled={processing} 
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          {processing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle2 size={18} /> Simular Pago Éxito (Gratis)</>}
        </button>
        <button 
          onClick={onClose} 
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

const CheckoutForm: React.FC<{ amount: number, description: string, onSuccess: () => void, onClose: () => void }> = ({ amount, description, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch PaymentIntent client secret from backend
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => setError('Error al inicializar el pago.'));
  }, [amount, description]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // If it's a mock client secret, simulate success
    if (clientSecret === 'mock_client_secret_for_testing') {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }, 1500);
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement as any,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Ocurrió un error inesperado.');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSuccess(true);
      setProcessing(false);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">¡Pago Exitoso!</h3>
        <p className="text-slate-500 font-medium">El pago de ${amount.toFixed(2)} MXN se ha procesado correctamente.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Total a Pagar</span>
          <span className="text-2xl font-black text-blue-600">${amount.toFixed(2)} MXN</span>
        </div>
        <p className="text-xs text-slate-500 font-medium">{description}</p>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Datos de la Tarjeta</label>
        <div className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#0f172a',
                  '::placeholder': {
                    color: '#94a3b8',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }} 
          />
        </div>
        {error && <div className="text-xs text-red-500 font-bold ml-2">{error}</div>}
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase justify-center">
        <ShieldCheck size={14} className="text-emerald-500" />
        Pagos seguros procesados por Stripe
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={processing || !clientSecret || (!stripe && clientSecret !== 'mock_client_secret_for_testing')}
          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CreditCard size={16} /> Pagar Ahora
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, description, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="text-blue-600" size={18} /> Procesar Pago
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          {HAS_STRIPE_KEY && stripePromise ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm amount={amount} description={description} onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <MockCheckout amount={amount} description={description} onSuccess={onSuccess} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
