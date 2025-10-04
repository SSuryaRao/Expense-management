import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});


//bugs fix
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type Country = {
  name: {
    common: string;
    official: string;
  };
  currencies: {
    [key: string]: {
      name: string;
      symbol: string;
    };
  };
};

export async function fetchCountriesAndCurrencies(): Promise<Country[]> {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
  if (!response.ok) throw new Error('Failed to fetch countries');
  return response.json();
}

export async function fetchExchangeRates(baseCurrency: string): Promise<{
  base: string;
  rates: { [key: string]: number };
}> {
  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
  if (!response.ok) throw new Error('Failed to fetch exchange rates');
  return response.json();
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;

  const data = await fetchExchangeRates(fromCurrency);
  const rate = data.rates[toCurrency];

  if (!rate) throw new Error(`Exchange rate not found for ${toCurrency}`);

  return amount * rate;
}

export async function simulateOCR(file: File): Promise<{
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  merchant: string;
}> {
  try {
    // Send file to backend for OCR processing
    const formData = new FormData();
    formData.append('receipt', file);

    const { data } = await api.post('/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Backend OCR Result:', data);

    return {
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      category: data.category || '',
      description: data.description || '',
      date: data.date || new Date().toISOString().split('T')[0],
      merchant: data.merchant || '',
    };
  } catch (error) {
    console.error('OCR Error:', error);
    // Fallback to empty data if OCR fails
    return {
      amount: 0,
      currency: 'USD',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      merchant: '',
    };
  }
}
