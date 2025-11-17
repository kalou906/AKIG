// frontend-react/src/hooks/usePushNotifications.ts
/**
 * Hook pour notifications push PWA
 * - Demande permission
 * - S'abonne aux notifications
 * - Envoie la subscription au backend
 */
import { useEffect, useState } from 'react';

interface PushSubscriptionState {
  isSubscribed: boolean;
  isSupported: boolean;
  isPending: boolean;
  error: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSubscribed: false,
    isSupported: false,
    isPending: false,
    error: null,
  });

  // Vérifier le support et l'état de la subscription
  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      setState((prev) => ({ ...prev, isSupported: true }));

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setState((prev) => ({
          ...prev,
          isSubscribed: !!subscription,
        }));
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    checkSupport();
  }, []);

  const subscribe = async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isPending: true, error: null }));

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Permission denied for notifications');
      }

      // Obtenir le service worker
      const registration = await navigator.serviceWorker.ready;

      // S'abonner aux push notifications
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Envoyer la subscription au backend
      const response = await fetch('/api/subscribe-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isPending: false,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isPending: false,
      }));

      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isPending: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Informer le backend
        await fetch('/api/unsubscribe-push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isPending: false,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isPending: false,
      }));

      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
