/**
 * PayU India Payment Gateway Integration
 * Handles initiation and form submission for PayU checkout
 */

export interface PayUPaymentPayload {
  amount: number;
  productinfo: string;
  firstname?: string;
  email?: string;
  phone?: string;
}

export interface PayUInitiateResponse {
  success: boolean;
  txnid: string;
  action_url: string;
  params: Record<string, string>;
}

export async function initiatePayUCheckout(payload: PayUPaymentPayload): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Get token if user is signed in
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || localStorage.getItem('nex_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiUrl}/api/payment/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: payload.amount,
      productinfo: payload.productinfo,
      firstname: payload.firstname || 'Taxpayer',
      email: payload.email || 'taxpayer@ofstax.in',
      phone: payload.phone || '9999999999',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to initiate payment with PayU gateway');
  }

  const data: PayUInitiateResponse = await response.json();

  if (typeof window !== 'undefined') {
    localStorage.setItem('last_payment_txnid', data.txnid);
    localStorage.setItem('last_payment_amount', payload.amount.toString());
    localStorage.setItem('last_payment_plan', payload.productinfo);
  }

  // Create dynamic form and submit to PayU
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = data.action_url;
  form.style.display = 'none';

  for (const [key, value] of Object.entries(data.params)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value ?? '';
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * Test simulation utility for development / instant bypass
 */
export async function simulatePaymentSuccess(txnid: string): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/api/payment/simulate-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txnid, status: 'success' }),
    });
    return res.ok;
  } catch (err) {
    console.error('Simulation error:', err);
    return false;
  }
}
