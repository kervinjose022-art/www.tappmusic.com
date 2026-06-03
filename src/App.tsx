/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VIPTier, WithdrawalConfig } from './types';
import { 
  DEFAULT_VIP_TIERS, 
  DEFAULT_WITHDRAWAL_CONFIG,
  calculateReward
} from './utils';
// Firebase Authentication and Cloud Sync imports
import { 
  auth, 
  db, 
  googleProvider, 
  updateFirebaseApiKey, 
  getFirebaseConfig 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { 
  Database, 
  CloudLightning, 
  Key, 
  LogOut, 
  Unlock 
} from 'lucide-react';
import { VIPTierCard } from './components/VIPTierCard';
import { WithdrawalCalendar } from './components/WithdrawalCalendar';
import { CodeExporter } from './components/CodeExporter';
import { RegistrationSimulator } from './components/RegistrationSimulator';
import { 
  Plus, 
  RotateCcw, 
  Coins, 
  Percent, 
  ShieldAlert, 
  CheckCircle,
  FolderSync,
  HelpCircle,
  Music,
  Video,
  Play,
  Pause,
  Award,
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Sliders,
  ShieldCheck,
  Check,
  Disc,
  Clock
} from 'lucide-react';

export default function App() {
  // --- CORE STATE PERSISTENCE ---
  const [conversionRate, setConversionRate] = useState<number>(36.7);
  const [viptiers, setViptiers] = useState<VIPTier[]>([]);
  const [withdrawalConfig, setWithdrawalConfig] = useState<WithdrawalConfig>(DEFAULT_WITHDRAWAL_CONFIG);

  // --- AUDIOVISUAL / REELS INTERACTIVE CLIENT STATES ---
  const [activeMainTab, setActiveMainTab] = useState<'client' | 'admin' | 'superadmin'>('client');
  const [userCoins, setUserCoins] = useState<number>(100);
  const [userVIPTier, setUserVIPTier] = useState<string>('invitado');
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
  const [selectedReelIdx, setSelectedReelIdx] = useState<number>(0);
  const [videoTimer, setVideoTimer] = useState<number>(25);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [showRewardVideoModal, setShowRewardVideoModal] = useState<boolean>(false);
  const [claimVideoRewardAmount, setClaimVideoRewardAmount] = useState<number>(0);
  const [synthAudioBpm, setSynthAudioBpm] = useState<number>(120);
  const [vinylPlaying, setVinylPlaying] = useState<boolean>(false);

  // --- DEPOSIT REQUESTS & UPGRADES STATE ---
  const [depositRequestsList, setDepositRequestsList] = useState<any[]>([]);
  const [showVIPDepositModal, setShowVIPDepositModal] = useState<boolean>(false);
  const [targetDepositTier, setTargetDepositTier] = useState<VIPTier | null>(null);
  const [enteredReferenceProof, setEnteredReferenceProof] = useState<string>('');
  
  // --- REAL VIDEO ITEMS LIST ---
  const REEL_MUSIC_TASKS = [
    {
      title: "Mente de Millonario - Sabiduría Financiera",
      quote: "No te enfoques en el dinero, enfócate en el valor que entregas al mundo y las monedas vendrán solas.",
      category: "MOTIVACIÓN",
      videoUrl: "https://www.youtube.com/embed/5qap5aO4i9A"
    },
    {
      title: "Jesús en mi Corazón - Reflexión de Fe",
      quote: "La fe no hace que las cosas sean fáciles, hace que las cosas sean perfectamente posibles.",
      category: "CREENCIAS",
      videoUrl: "https://www.youtube.com/embed/tntOCGkgt98"
    },
    {
      title: "Éxito Inquebrantable - Fuerza Emprendedora",
      quote: "El único fracaso real es dejar de intentarlo. Cada caída es un paso más hacia tu membresía dorada.",
      category: "EMPRENDER",
      videoUrl: "https://www.youtube.com/embed/jfKfPfyJRdk"
    },
    {
      title: "Disciplina Metódica - Hábitos Productivos",
      quote: "La disciplina silenciosa diaria es el secreto mejor guardado de los súper administradores de vida.",
      category: "PRODUCTIVIDAD",
      videoUrl: "https://www.youtube.com/embed/gWyc9w0K_e0"
    }
  ];

  // --- FIREBASE CLOUD SYNC STATES ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [cloudSyncing, setCloudSyncing] = useState<boolean>(false);
  const [cloudLoaded, setCloudLoaded] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [apiKeyValue, setApiKeyValue] = useState<string>('');
  const [authErrorDiagnostics, setAuthErrorDiagnostics] = useState<{
    code: string;
    message: string;
    actionSteps: string[];
  } | null>(null);

  const handleAuthError = (err: any) => {
    console.error("Firebase Details:", err);
    const code = err?.code || 'desconocido';
    const rawMessage = err?.message || '';
    
    let message = 'Ocurrió un error al intentar conectarte a Firebase.';
    let actionSteps: string[] = [];

    if (code === 'auth/unauthorized-domain' || rawMessage.includes('unauthorized-domain') || rawMessage.includes('domain is not authorized')) {
      const currentHost = window.location.hostname;
      message = `El dominio actual (${currentHost}) no está autorizado en tu proyecto Firebase para Google Sign-In.`;
      actionSteps = [
        `1. Ve a console.firebase.google.com y abre tu proyecto "tappmusic-e9406".`,
        `2. En el menú izquierdo, ve a "Authentication" -> pestaña "Settings" (Ajustes).`,
        `3. Haz clic en la opción "Authorized domains" (Dominios autorizados).`,
        `4. Haz clic en "Add domain" (Agregar dominio) y pega exactamente: ${currentHost}`,
        `5. Guarda los cambios e intenta iniciar sesión de nuevo aquí.`
      ];
    } else if (code === 'auth/operation-not-allowed' || rawMessage.includes('operation-not-allowed')) {
      message = 'El proveedor Google Sign-In no está activo en Firebase Authentication.';
      actionSteps = [
        `1. Abre console.firebase.google.com e ingresa a tu proyecto "tappmusic-e9406" (tappmusic-e9406).`,
        `2. Ve a "Authentication" en el menú izquierdo -> pestaña "Sign-in method" (Método de inicio).`,
        `3. Haz clic en "Add new provider" (Agregar nuevo proveedor) y selecciona "Google".`,
        `4. Activa el interruptor de Habilitar, asigna tu correo de asistencia en el campo requerido y haz clic en Guardar.`,
        `5. Una vez guardado con éxito, haz clic en Conectar Cuenta de Google.`
      ];
    } else if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid' || rawMessage.includes('invalid-api-key')) {
      message = 'La API Key de Firebase guardada en tu navegador es incorrecta o inválida.';
      actionSteps = [
        `1. Asegúrate de copiar el valor correcto en el botón "Configurar Códigos".`,
        `2. Ve a console.firebase.google.com -> Abre tu proyecto de Firebase.`,
        `3. Haz clic en el Engrane ⚙️ arriba a la izquierda -> Configuración del proyecto.`,
        `4. Copia el valor exacto de la "Clave de API web" (Web API Key) que se muestra ahí y agrégalo en tu botón "Configurar Códigos" de esta Consola.`
      ];
    } else if (code === 'auth/popup-blocked') {
      message = 'El navegador ha bloqueado la ventana emergente de inicio de sesión.';
      actionSteps = [
        `1. Haz clic en la pequeña alerta sobre ventanas bloqueadas en la barra de navegación de tu navegador móvil o de escritorio.`,
        `2. Selecciona "Permitir siempre ventanas emergentes" para esta URL.`,
        `3. Vuelve a intentar presionar el botón de inicio de sesión.`
      ];
    } else if (code === 'auth/network-request-failed' || rawMessage.includes('network-request-failed') || rawMessage.includes('network request failed')) {
      message = 'La conexión con Google Firebase fue bloqueada por el navegador de tu celular porque estás dentro del marco (iframe) de Google AI Studio.';
      actionSteps = [
        `🔥 PASO PRINCIPAL RECOMENDADO: Abre la Consola en una pestaña independiente presionando "CERRAR" y luego el botón de alerta "ABRIR EN PESTAÑA NUEVA ↗" que verás arriba en la pantalla. Al no estar atrapado en el iframe, el inicio de sesión funcionará inmediatamente sin fallos de red.`,
        `👉 PASO ALTERNATIVO: Intenta usar el botón "Iniciar con Redirección" que se muestra abajo en este diagnóstico para evitar el bloqueo de ventanas emergentes.`,
        `👉 PASO EXTRA: Asegúrate de no tener activos bloqueadores de anuncios (SponsorBlock, uBlock, Brave Shields) ni VPNs que bloqueen conexiones a googleapis.com.`
      ];
    } else if (rawMessage.includes('insufficient permissions') || rawMessage.includes('permission-denied')) {
      message = 'La base de datos de Firestore tiene sus accesos bloqueados por reglas de seguridad de Firebase.';
      actionSteps = [
        `1. Ve a console.firebase.google.com -> Abre tu proyecto -> sección Firestore Database.`,
        `2. Ve a la pestaña "Rules" (Reglas).`,
        `3. Asegúrate de haber publicado las reglas correctas (que admitan lectura de la colección para administradores).`,
        `4. Haz clic en el botón "Publish" (Publicar) en la consola de Firebase.`
      ];
    } else {
      message = `Ocurrió un error en la conexión: ${rawMessage || code}`;
      actionSteps = [
        `Asegúrate de haber copiado exactamente el valor "apiKey" válido de Firebase.`,
        `Si ves una alerta roja permanente, haz clic en "Configurar Códigos" para revisar y cambiar la llave API por tu Clave de API web real.`,
        `Código de error técnico recibido: ${code}`
      ];
    }

    setAuthErrorDiagnostics({
      code,
      message,
      actionSteps
    });
  };

  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTier, setNewTier] = useState<Omit<VIPTier, 'id'> & { idInput: string }>({
    idInput: '',
    name: '',
    price: 10,
    reward: 367,
    rewardType: 'Monedas',
    desc: '',
    dailyTasks: 10,
    isActive: true
  });
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info'; text: string } | null>({
    type: 'info',
    text: 'Cargando configuraciones locales guardadas...'
  });

  // Track the stored API key override value
  useEffect(() => {
    const savedKey = localStorage.getItem('tapp_firebase_api_key_override') || '';
    setApiKeyValue(savedKey);

    // Verify if we are returning from a Google redirect authentication page
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setCurrentUser(result.user);
          setStatusMessage({
            type: 'success',
            text: '¡Sesión Iniciada por Redirección!'
          });
        }
      })
      .catch((err) => {
        console.error("Redirection flow error: ", err);
      });
  }, []);

  // Firebase Auth and Live Cloud Sync effect
  useEffect(() => {
    let unsubscribeConfig: (() => void) | null = null;
    let unsubscribeUserDoc: (() => void) | null = null;
    let unsubscribeRequests: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
        setConnectionError(null);
        try {
          // 1. Subscribe to Current User data document in real-time
          const userDocRef = doc(db, 'users', fbUser.uid);
          
          unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            const todayStr = new Date().toISOString().split('T')[0];
            
            if (docSnap.exists()) {
              const uData = docSnap.data();
              if (uData.isAdmin !== undefined) setIsAdmin(uData.isAdmin);
              if (uData.balance !== undefined) setUserCoins(uData.balance);
              if (uData.currentVIP !== undefined) setUserVIPTier(uData.currentVIP);
              
              // Handle Daily resets
              if (uData.lastTaskDate !== todayStr) {
                updateDoc(userDocRef, {
                  tasksCompletedToday: 0,
                  lastTaskDate: todayStr
                }).catch(e => console.error("Error resetting daily count:", e));
                setCompletedTasksCount(0);
              } else if (uData.tasksCompletedToday !== undefined) {
                setCompletedTasksCount(uData.tasksCompletedToday);
              }
            } else {
              // Create default user profile in DB
              const isBootstrappedAdmin = fbUser.email === 'kervinjose022@gmail.com';
              setDoc(userDocRef, {
                email: fbUser.email || '',
                isAdmin: isBootstrappedAdmin,
                balance: 100, // 100 coins welcome gift!
                currentVIP: 'invitado',
                tasksCompletedToday: 0,
                lastTaskDate: todayStr,
                createdAt: new Date().toISOString()
              }).catch(err => console.error("Error creating profile:", err));
              
              setUserCoins(100);
              setUserVIPTier('invitado');
              setCompletedTasksCount(0);
              setIsAdmin(isBootstrappedAdmin);
            }
          }, (err) => {
            console.error("User doc snapshot error:", err);
          });

          // 2. Subscribe to Deposit Requests in real-time for Súper Admin & clients
          const requestsRef = collection(db, 'deposit_requests');
          unsubscribeRequests = onSnapshot(requestsRef, (snapshot) => {
            const reqs: any[] = [];
            snapshot.forEach((snapDoc) => {
              reqs.push({ id: snapDoc.id, ...snapDoc.data() });
            });
            // Sort by createdAt descending
            reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setDepositRequestsList(reqs);
          }, (err) => {
            console.error("Requests list read error:", err);
          });

          // 3. Subscribe to config/default collection for real-time syncing
          const configDocRef = doc(db, 'config', 'default');
          unsubscribeConfig = onSnapshot(configDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (Array.isArray(data.viptiers)) {
                setViptiers(data.viptiers);
              }
              if (typeof data.conversionRate === 'number') {
                setConversionRate(data.conversionRate);
              }
              if (data.withdrawalConfig) {
                setWithdrawalConfig(data.withdrawalConfig);
              }
              setCloudLoaded(true);
            } else {
              setCloudLoaded(true);
            }
          }, (error) => {
            console.error("Snapshot read error", error);
            handleAuthError(error);
          });

        } catch (error: any) {
          console.error("Firestore auth connection error", error);
          setConnectionError("Revisa las reglas o configura tu API Key.");
          handleAuthError(error);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setCloudLoaded(false);
        setUserCoins(100); // Reset client coins to demo default
        setUserVIPTier('invitado');
        setCompletedTasksCount(0);
        
        if (unsubscribeConfig) unsubscribeConfig();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        if (unsubscribeRequests) unsubscribeRequests();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeConfig) unsubscribeConfig();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, []);

  // Load state from localStorage on mount (works as default, and local backup)
  useEffect(() => {
    try {
      const storedTiers = localStorage.getItem('tapp_vip_tiers');
      const storedRate = localStorage.getItem('tapp_conversion_rate');
      const storedWithdraw = localStorage.getItem('tapp_withdrawal_config');

      let initialTiers = DEFAULT_VIP_TIERS;
      if (storedTiers) {
        const parsed = JSON.parse(storedTiers);
        const hasOldData = parsed.some((t: any) => t.id === 'plata' && t.dailyTasks !== 5) || parsed.length !== DEFAULT_VIP_TIERS.length;
        if (parsed.some((t: any) => t.id === 'bronce') || parsed.length === 0 || hasOldData) {
          initialTiers = DEFAULT_VIP_TIERS;
          localStorage.setItem('tapp_vip_tiers', JSON.stringify(DEFAULT_VIP_TIERS));
        } else {
          initialTiers = parsed;
        }
      } else {
        localStorage.setItem('tapp_vip_tiers', JSON.stringify(DEFAULT_VIP_TIERS));
      }
      setViptiers(initialTiers);

      if (storedRate) {
        setConversionRate(Number(storedRate));
      } else {
        setConversionRate(36.7);
        localStorage.setItem('tapp_conversion_rate', '36.7');
      }

      let initialWithdraw = DEFAULT_WITHDRAWAL_CONFIG;
      if (storedWithdraw) {
        initialWithdraw = JSON.parse(storedWithdraw);
      } else {
        localStorage.setItem('tapp_withdrawal_config', JSON.stringify(DEFAULT_WITHDRAWAL_CONFIG));
      }
      setWithdrawalConfig(initialWithdraw);

      setStatusMessage({
        type: 'success',
        text: '¡Consola de tappmusic cargada con éxito localmente!'
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error('Failed to load localStorage', e);
      setViptiers(DEFAULT_VIP_TIERS);
      setConversionRate(36.7);
      setWithdrawalConfig(DEFAULT_WITHDRAWAL_CONFIG);
    }
  }, []);

  // --- REEL VIDEO TASK TIMER EFFECT ---
  useEffect(() => {
    let interval: any = null;
    if (isPlayingVideo && videoTimer > 0) {
      interval = setInterval(() => {
        setVideoTimer(prev => prev - 1);
      }, 1000);
    } else if (videoTimer === 0 && isPlayingVideo) {
      setIsPlayingVideo(false);
      
      // Calculate current task reward based on selected VIP level and system settings
      const activeVIPDetails = viptiers.find(t => t.id === userVIPTier) || { id: 'invitado', name: 'Invitado', dailyTasks: 1, reward: 5 };
      const coinsReward = Math.ceil((activeVIPDetails.reward || 5) / (activeVIPDetails.dailyTasks || 1));
      
      setClaimVideoRewardAmount(coinsReward);
      setShowRewardVideoModal(true);
      
      const newCoins = userCoins + coinsReward;
      const newTasksCount = completedTasksCount + 1;
      
      setUserCoins(newCoins);
      setCompletedTasksCount(newTasksCount);

      // Save user metrics to Firestore (if logged in) or localstorage
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        updateDoc(userDocRef, {
          balance: newCoins,
          tasksCompletedToday: newTasksCount,
          lastTaskDate: new Date().toISOString().split('T')[0]
        }).catch(err => console.error("Error saving user video rewards:", err));
      }
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo, videoTimer, userVIPTier, viptiers, userCoins, completedTasksCount, currentUser]);

  // --- LOFI SYNTH AUDIO PULSE CONTROLLER ---
  useEffect(() => {
    let synthInterval: any = null;
    let audioCtx: AudioContext | null = null;
    
    if (vinylPlaying) {
      synthInterval = setInterval(() => {
        try {
          if (!audioCtx) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          
          // Generate a beautifully cozy cozy lo-fi synth tone pulse
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          // Relaxing triangle chord sound
          osc.type = 'triangle';
          const frequencies = [220, 261.63, 329.63, 392.00]; // A3, C4, E4, G4 (Am7 chord)
          const randomNote = frequencies[Math.floor(Math.random() * frequencies.length)];
          
          osc.frequency.setValueAtTime(randomNote, audioCtx.currentTime);
          
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
          
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.9);
        } catch (e) {
          // ignore autoplay blocks
        }
      }, (60 / synthAudioBpm) * 1000);
    }
    
    return () => {
      if (synthInterval) clearInterval(synthInterval);
    };
  }, [vinylPlaying, synthAudioBpm]);

  // --- SUBMIT BOOKING / UPGRADE VIP REQUEST TO ADMIN ---
  const handleRequestVIPTier = async (tier: VIPTier, proofCode: string) => {
    if (!proofCode.trim()) {
      alert("Por favor, introduce el código de referencia o captura de tu transferencia.");
      return;
    }
    
    const todayStr = new Date().toISOString();
    const requestId = "req_" + Math.random().toString(36).substring(2, 9);
    
    const newRequestPayload = {
      userId: currentUser ? currentUser.uid : "local-user",
      username: currentUser ? (currentUser.displayName || currentUser.email) : "Usuario Demostración",
      userEmail: currentUser ? currentUser.email : "Invitado local",
      tierId: tier.id,
      tierName: tier.name,
      price: tier.price,
      status: "pending",
      referenceId: proofCode,
      createdAt: todayStr
    };
    
    // Save locally
    const updatedRequests = [newRequestPayload, ...depositRequestsList];
    setDepositRequestsList(updatedRequests);
    
    // Write in cloud
    if (currentUser) {
      try {
        const reqDocRef = doc(db, 'deposit_requests', requestId);
        await setDoc(reqDocRef, newRequestPayload);
        
        setStatusMessage({
          type: 'success',
          text: `¡Solicitud de activación para ${tier.name} enviada con éxito!`
        });
      } catch (err: any) {
        console.error("Firestore deposit error:", err);
        alert("Tu solicitud quedó guardada en memoria local por falta de conexión en la nube.");
      }
    } else {
      setStatusMessage({
        type: 'info',
        text: `¡Demos: Activación registrada localmente! Ve al Panel de Súper Administrador para aprobarla.`
      });
    }
    
    setShowVIPDepositModal(false);
    setEnteredReferenceProof('');
  };

  // --- MASTER ACTION: APPROVE DEPOSIT REQUEST (SUPERADMIN) ---
  const handleApproveRequest = async (req: any) => {
    if (!confirm(`¿Estás seguro de APROBAR el depósito de $${req.price} de ${req.username} para activar ${req.tierName}?`)) {
      return;
    }
    
    // 1. Update request status locally
    const updated = depositRequestsList.map(r => r.id === req.id || (r.referenceId === req.referenceId && r.userId === req.userId) ? { ...r, status: "approved" } : r);
    setDepositRequestsList(updated);
    
    // 2. Perform the cloud database write logic
    if (currentUser) {
      try {
        // Update user's active VIP tier & reward credits
        const targetUserDoc = doc(db, 'users', req.userId);
        
        // Fetch current user details to add initial welcome coins
        const snap = await getDoc(targetUserDoc);
        let currBalance = req.price * conversionRate; // Multiplies purchase value automatically
        if (snap.exists()) {
          const ud = snap.data();
          currBalance += (ud.balance || 0);
        }
        
        await updateDoc(targetUserDoc, {
          currentVIP: req.tierId,
          balance: currBalance
        });
        
        // Update the requests register status to Approved
        // Look up request.id. If offline simulated requests list doesn't have an id, we query/refer by user payload
        const reqRefId = req.id || "manual";
        if (reqRefId !== "manual") {
          const reqDocRef = doc(db, 'deposit_requests', reqRefId);
          await updateDoc(reqDocRef, { status: "approved" });
        }
        
        setStatusMessage({
          type: 'success',
          text: `¡Aprobado! ${req.username} ahora es miembro ${req.tierName} y se sumaron sus coins.`
        });
      } catch (err) {
        console.error("Firestore approval error:", err);
        alert("Ocurrió un error al guardar en Firestore. Sigo con simulación aprobada local.");
      }
    } else {
      // Offline Simulated Upgrade
      if (req.userId === 'local-user') {
        setUserVIPTier(req.tierId);
        setUserCoins(prev => prev + Math.floor(req.price * conversionRate));
      }
      setStatusMessage({
        type: 'success',
        text: '¡Simulación: Depósito aprobado! Membresía activa para pruebas.'
      });
    }
  };

  // --- MASTER ACTION: REJECT DEPOSIT REQUEST (SUPERADMIN) ---
  const handleRejectRequest = async (req: any) => {
    if (!confirm(`¿Estás seguro de RECHAZAR el depósito de ${req.username}?`)) {
      return;
    }
    
    const updated = depositRequestsList.map(r => r.id === req.id || (r.referenceId === req.referenceId && r.userId === req.userId) ? { ...r, status: "rejected" } : r);
    setDepositRequestsList(updated);
    
    if (currentUser) {
      try {
        const reqRefId = req.id || "manual";
        if (reqRefId !== "manual") {
          const reqDocRef = doc(db, 'deposit_requests', reqRefId);
          await updateDoc(reqDocRef, { status: "rejected" });
        }
        setStatusMessage({
          type: 'info',
          text: `Depósito rechazado correctamente.`
        });
      } catch (err) {
        console.error("Firestore rejection error:", err);
      }
    } else {
      setStatusMessage({
        type: 'info',
        text: 'Simulación: Depósito rechazado localmente.'
      });
    }
  };

  // Save states helper (unified to update localStorage and automatically sync to Cloud Firestore if connected as Admin)
  const saveState = async (updatedTiers: VIPTier[], updatedRate: number, updatedWithdraw: WithdrawalConfig) => {
    // 1. Save to local storage as safety backup
    try {
      localStorage.setItem('tapp_vip_tiers', JSON.stringify(updatedTiers));
      localStorage.setItem('tapp_conversion_rate', String(updatedRate));
      localStorage.setItem('tapp_withdrawal_config', JSON.stringify(updatedWithdraw));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }

    // 2. Clear sync states and write to Cloud Firebase if admin is authenticated
    if (auth.currentUser && isAdmin) {
      setCloudSyncing(true);
      try {
        const configDocRef = doc(db, 'config', 'default');
        await setDoc(configDocRef, {
          viptiers: updatedTiers,
          conversionRate: updatedRate,
          withdrawalConfig: updatedWithdraw,
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser.email || 'Admin User'
        });
      } catch (err: any) {
        console.error("Firestore persistence error", err);
        setStatusMessage({
          type: 'info',
          text: 'Error de sincronización en la nube. Verifica tus reglas o API Key.'
        });
      } finally {
        setCloudSyncing(false);
      }
    }
  };

  // Modify rate
  const handleRateChange = (newVal: number) => {
    setConversionRate(newVal);
    
    // Automatically update rewards for tiers that are linked to global rate
    const updated = viptiers.map(t => {
      // If reward roughly matches the old conversion or is linked, update it
      // For precision, let's keep it simple: we can recalculate reward if price matches
      return {
        ...t,
        reward: calculateReward(t.price, newVal)
      };
    });
    setViptiers(updated);
    saveState(updated, newVal, withdrawalConfig);
  };

  // Update single tier
  const handleUpdateTier = (updated: VIPTier) => {
    const newList = viptiers.map(t => t.id === updated.id ? updated : t);
    setViptiers(newList);
    saveState(newList, conversionRate, withdrawalConfig);
  };

  // Delete single tier
  const handleDeleteTier = (id: string) => {
    const newList = viptiers.filter(t => t.id !== id);
    setViptiers(newList);
    saveState(newList, conversionRate, withdrawalConfig);
    
    setStatusMessage({ type: 'info', text: `Se eliminó la membresía '${id}'.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Update configurations
  const handleUpdateWithdrawal = (updated: WithdrawalConfig) => {
    setWithdrawalConfig(updated);
    saveState(viptiers, conversionRate, updated);
  };

  // Reset to original defaults
  const handleResetToDefaults = () => {
    if (confirm('¿Estás seguro de restablecer todos los planes VIP y la configuración de retiros a los valores originales de tappmusic? Perderás tus cambios manuales.')) {
      setViptiers(DEFAULT_VIP_TIERS);
      setConversionRate(36.7);
      setWithdrawalConfig(DEFAULT_WITHDRAWAL_CONFIG);
      saveState(DEFAULT_VIP_TIERS, 36.7, DEFAULT_WITHDRAWAL_CONFIG);
      
      setStatusMessage({ type: 'success', text: 'Se han restablecido los valores de fábrica con éxito.' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Add new tier submission handler
  const handleAddTierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedId = newTier.idInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!formattedId) {
      alert('Por favor especifica un ID único para la membresía');
      return;
    }

    if (viptiers.some(t => t.id === formattedId)) {
      alert(`El ID de membresía "${formattedId}" ya existe. Elige uno diferente (ej. diamante-v2, rubi-premium)`);
      return;
    }

    const tierToCreate: VIPTier = {
      id: formattedId,
      name: newTier.name || `VIP ${newTier.idInput.toUpperCase()}`,
      price: newTier.price,
      reward: newTier.reward,
      rewardType: newTier.rewardType,
      desc: newTier.desc || 'Acceso de misiones',
      dailyTasks: newTier.dailyTasks,
      isActive: true
    };

    const newList = [...viptiers, tierToCreate];
    setViptiers(newList);
    saveState(newList, conversionRate, withdrawalConfig);

    // Reset Form Input State
    setNewTier({
      idInput: '',
      name: '',
      price: 10,
      reward: 367,
      rewardType: 'Monedas',
      desc: '',
      dailyTasks: 10,
      isActive: true
    });
    setShowAddForm(false);

    setStatusMessage({ type: 'success', text: `¡Rango VIP "${tierToCreate.name}" agregado exitosamente!` });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 flex flex-col font-sans" id="applet-viewport">
      
      {/* Visual Navigation Bar */}
      <nav className="border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 flex justify-between items-center" id="nav-header">
        <div className="flex items-center gap-2.5">
          {/* Logo with musical branding icon representing TAPPMUSIC C */}
          <div className="h-8 w-8 bg-gradient-to-tr from-emerald-500 to-[#121212] rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/10">
            <Music className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base leading-none tracking-tight text-white">TAPPMUSIC C</span>
              <span className="text-[10px] font-mono leading-none bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                Consola Sync
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Panel de Control para Kervin Jose</p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {/* Status Alert Badge */}
          {statusMessage && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium py-1 px-3 rounded-full border border-slate-800 bg-slate-900/50 text-slate-300 transition-all">
              <CheckCircle className="h-3 w-3 shrink-0 text-emerald-400" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Show Admin Authentication controls */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-950/40 border border-white/5 py-1 px-1.5 rounded-lg">
              {currentUser.photoURL ? (
                <img 
                  referrerPolicy="no-referrer" 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="h-6 w-6 rounded-md border border-white/10" 
                />
              ) : (
                <div className="h-6 w-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="hidden sm:flex flex-col items-start pr-1">
                <span className="text-[9px] font-mono leading-none text-slate-300 truncate max-w-[80px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[8px] text-emerald-400 font-mono mt-0.5 leading-none">
                  {isAdmin ? 'Admin' : 'Pendiente'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => signOut(auth).then(() => {
                  setStatusMessage({ type: 'info', text: 'Sesión de Firebase cerrada correctamente' });
                  setTimeout(() => setStatusMessage(null), 3000);
                  window.location.reload();
                })}
                className="p-1 text-slate-400 hover:text-red-400 rounded-md hover:bg-white/5 transition-all"
                title="Cerrar sesión"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                signInWithPopup(auth, googleProvider)
                  .then(() => {})
                  .catch((err) => {
                    console.error("Login popup error", err);
                    setStatusMessage({
                      type: 'info',
                      text: 'Error al iniciar sesión con Google. Revisa tu API Key de Firebase.'
                    });
                    handleAuthError(err);
                  });
              }}
              className="flex items-center gap-1 py-1 px-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-all border border-emerald-400/20 shrink-0"
              title="Sincronizar base de datos de Firebase"
            >
              <Unlock className="h-3 w-3 shrink-0" />
              <span className="hidden sm:inline">Conectar Google</span>
              <span className="inline sm:hidden">Login</span>
            </button>
          )}

          {/* Firebase Credentials Config Button (Kervin's codes manager) */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-1 px-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-xs"
            title="Configurar Códigos de Firebase"
          >
            <Key className="h-3 w-3 text-emerald-400" />
            <span className="hidden md:inline font-mono">Configurar Códigos</span>
          </button>

          {/* Reset Factory values */}
          <button
            type="button"
            id="btn-global-reset"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1 py-1 px-2 text-xs bg-[#0b0f19] border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
            title="Sincronizar defaults de fábrica"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </nav>

      {/* Cloud Integration Banner */}
      {connectionError ? (
        <div className="bg-red-500/10 border-b border-red-500/15 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-xs text-red-400 font-mono flex items-center gap-1.5 justify-center text-left">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
              <span>{connectionError}</span>
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold uppercase px-3 py-1 rounded border border-emerald-500/30 transition-all flex items-center gap-1 shrink-0"
              >
                Abrir en Pestaña Nueva ⚡
              </a>
              <button
                onClick={() => setShowConfigModal(true)}
                className="text-[10px] font-mono bg-red-400/10 hover:bg-red-400/20 text-red-300 font-semibold uppercase px-2.5 py-1 rounded border border-red-500/20 transition-all cursor-pointer shrink-0"
              >
                Ajustar apiKey de Firebase ⚙️
              </button>
            </div>
          </div>
        </div>
      ) : currentUser && isAdmin ? (
        <div className="bg-emerald-500/5 border-b border-emerald-500/10 py-1.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 animate-pulse text-emerald-400 shrink-0" />
              <span>Sincronizado e integrado con Firestore de tappmusic-e9406 (TAPPMUSIC C)</span>
            </span>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full hidden sm:inline-block">
              Nube Activa Bidireccional {cloudSyncing ? '(Sincronizando cambios...)' : '(Al día)'}
            </span>
          </div>
        </div>
      ) : currentUser && !isAdmin ? (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-slate-300">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5 justify-center text-left">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Sesión iniciada. Tu UID es <code className="bg-slate-950 px-1 py-0.5 rounded text-white text-[11px]">{currentUser.uid}</code>. Verifícalo en tu colección 'users' para activar Admin.</span>
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentUser.uid);
                alert(`UID Copiado: ${currentUser.uid}\n\nIngresa este UID en tu colección de Firestore '/users/${currentUser.uid}' con el campo 'isAdmin: true' (boolean) para habilitar de inmediato tu consola admin.`);
              }}
              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono px-2.5 py-1 rounded border border-amber-500/30 transition-all cursor-pointer font-bold"
            >
              Copiar mi UID para Firestore ↗
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#0b0f19]/30 border-b border-white/5 py-2 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 justify-center text-left">
              <CloudLightning className="h-4 w-4 text-slate-500 shrink-0" />
              <span>Modo Local Seguro. Conéctate con Google para sincronizar y respaldar filas dinámicamente en tu Firebase.</span>
            </span>
            <button
              onClick={() => {
                signInWithPopup(auth, googleProvider).catch((err) => {
                  setStatusMessage({
                    type: 'info',
                    text: 'Error de conexión. Ingresa tu API Key de Firebase primero.'
                  });
                  handleAuthError(err);
                });
              }}
              className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold font-mono underline"
            >
              Conectar Cuenta de Google ↗
            </button>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Dynamic Mobile Status Banner */}
        {statusMessage && (
          <div className="flex md:hidden items-center gap-1.5 text-xs py-2 px-3 rounded-lg border bg-slate-900/80 border-slate-800 text-slate-300">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">{statusMessage.text}</span>
          </div>
        )}

        {/* --- DYNAMIC STATS OVERVIEW HEADER BAR --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0b0f19]/70 border border-white/5 rounded-2xl p-4 md:p-5 shadow-lg shadow-emerald-500/[0.02]">
          <div className="flex items-center gap-4 border-r border-white/5 pr-4 last:border-0 last:pr-0">
            <div className="h-10 w-10 bg-gradient-to-tr from-amber-500/20 to-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400">
              <Coins className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Mi Cartera Tapp</p>
              <h3 className="text-xl font-bold text-white font-mono">{userCoins} Monedas</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-4 border-r border-white/5 pr-4 last:border-0 last:pr-0">
            <div className="h-10 w-10 bg-gradient-to-tr from-emerald-500/20 to-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Membresía Activa</p>
              <h3 className="text-md font-bold text-white flex items-center gap-1">
                {userVIPTier.toUpperCase()}
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-1.5 rounded uppercase">
                  {userVIPTier === 'invitado' ? 'Demos' : 'VIP'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 last:border-0 last:pr-0">
            <div className="h-10 w-10 bg-gradient-to-tr from-sky-500/20 to-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 text-sky-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Tareas Diarias Completadas</p>
              <h3 className="text-xl font-bold text-white font-mono">
                {completedTasksCount} / {((viptiers.find(t => t.id === userVIPTier)?.dailyTasks) || 1)}
              </h3>
            </div>
          </div>
        </div>

        {/* --- HIGH-FIDELITY MAIN VIEW INTERACTIVE NAVIGATION TABS --- */}
        <div className="flex border-b border-white/5 space-x-1 p-1 bg-[#0b0f19]/60 backdrop-blur rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveMainTab('client')}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              activeMainTab === 'client' 
                ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/25 text-emerald-400 font-bold shadow' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Music className="h-4 w-4" />
            🎵 Reproductor de Tareas (Ganar Coins)
          </button>
          
          <button
            type="button"
            onClick={() => setActiveMainTab('admin')}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              activeMainTab === 'admin' 
                ? 'bg-gradient-to-r from-sky-500/15 to-sky-500/5 border border-sky-500/25 text-sky-450 font-bold shadow' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Sliders className="h-4 w-4" />
            🔧 Consola Config VIP & Retiros
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('superadmin')}
            className={`flex-1 py-3 text-xs font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative ${
              activeMainTab === 'superadmin' 
                ? 'bg-gradient-to-r from-purple-500/15 to-purple-500/5 border border-purple-500/25 text-purple-400 font-bold shadow' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            👑 Panel Súper-Admin (Membresías & Pagos)
            {depositRequestsList.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white whitespace-nowrap animate-bounce px-1">
                {depositRequestsList.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* --- TAB SELECTOR FOR ORIGINAL ADMIN CONTROL DASHBOARD --- */}
        {activeMainTab === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Control Center Banner Grid: Configuration variables */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="global-control-dashboard">
          
          {/* Box 1: Multiplicador global de conversión */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3.5 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                Matemáticas de Monedas
              </span>
              <h4 className="text-xl font-display font-bold text-white">
                1 USD = {conversionRate} Monedas
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Esta es la tasa central de cobro. Los VIP vinculados multiplican su precio por este valor para fijar el premio automáticamente sin cálculos manuales.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Modificar Tasa:</span>
                <span className="font-bold text-white">{conversionRate}x</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="0.1"
                value={conversionRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Box 2: Liquidity Protection Status rules */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-emerald-400" />
                Sostenibilidad del Sistema
              </span>
              <h4 className="text-xl font-display font-bold text-white">
                Frecuencia & Comisiones
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Has establecido límites de retiro para que tus usuarios puedan cobrar {
                  withdrawalConfig.type === 'dates' ? `solo los días ${withdrawalConfig.monthlyDates.join(', ')} de cada mes.` : 
                  withdrawalConfig.type === 'weekly' ? 'solo los días de la semana seleccionados.' : 
                  `exactamente cada ${withdrawalConfig.intervalDays} días recurrentes.`
                } Adicionalmente, el sistema cobrará la tasa del <strong className="text-emerald-400 font-mono">{withdrawalConfig.feePercentage ?? 5}%</strong> de comisión de retiro.
              </p>
            </div>

            <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg border border-emerald-500/15 flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Intervalo actual: {withdrawalConfig.type === 'dates' ? 'Mensuales' : 'Personalizado'}</span>
              </div>
              <span className="text-amber-400 font-bold font-mono">Fee: {withdrawalConfig.feePercentage ?? 5}%</span>
            </div>
          </div>

          {/* Box 3: Quick Action Center */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderSync className="h-3.5 w-3.5 text-emerald-400" />
                Membresías Totales
              </span>
              <h4 className="text-xl font-display font-bold text-white">
                {viptiers.length} Rangos VIP Habilitados
              </h4>
              <p className="text-slate-400 text-xs leading-normal">
                Activa, descarta o recula ganancias. Los cambios se exportan en tiempo real como array, JSON, o plantillas HTML en la parte de abajo.
              </p>
            </div>

            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                id="btn-trigger-add-tier"
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4 shrink-0" />
                {showAddForm ? 'Cerrar Nuevo Rango' : 'Crear Nueva Membresía VIP'}
              </button>
            </div>
          </div>
        </div>

        {/* Create membership Form (Dynamic Overlay-like dropdown) */}
        {showAddForm && (
          <form 
            onSubmit={handleAddTierSubmit}
            className="p-5 rounded-2xl border border-sky-400/35 bg-[#0b101d] space-y-4 shadow-xl ring-2 ring-sky-400/10 animate-fade-in"
            id="add-vip-form"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-sky-400" />
                Fijar Nueva Membresía para TAPPMUSIC C
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">ID Único (Ej: platino-pro)</label>
                <input
                  type="text"
                  required
                  placeholder="diamante-premium"
                  value={newTier.idInput}
                  onChange={(e) => setNewTier({ ...newTier, idInput: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Nombre de Rango</label>
                <input
                  type="text"
                  required
                  placeholder="VIP Diamante Premium"
                  value={newTier.name}
                  onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Precio ($ USD)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTier.price}
                  onChange={(e) => {
                    const priceVal = Number(e.target.value);
                    setNewTier({ 
                      ...newTier, 
                      price: priceVal,
                      reward: Math.round(priceVal * conversionRate) // Auto-calculate reward based on default rate
                    });
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium flex justify-between">
                  Monto de Recompensa
                  <span className="text-[10px] text-emerald-400/80">({newTier.rewardType})</span>
                </label>
                <input
                  type="number"
                  required
                  value={newTier.reward}
                  onChange={(e) => setNewTier({ ...newTier, reward: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tipo de Recompensa</label>
                <select
                  value={newTier.rewardType}
                  onChange={(e) => setNewTier({ ...newTier, rewardType: e.target.value as 'Monedas' | 'USD' })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
                >
                  <option value="Monedas">Monedas</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Tareas/Videos Diarios</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTier.dailyTasks}
                  onChange={(e) => setNewTier({ ...newTier, dailyTasks: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Descripción Corta del Rango</label>
              <input
                type="text"
                placeholder="20 misiones diarias VIP, soporte preferencial, etc."
                value={newTier.desc}
                onChange={(e) => setNewTier({ ...newTier, desc: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg py-1.5 px-3 text-slate-200"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                id="btn-add-vip-submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-6 rounded-lg transition-all"
              >
                Agregar Membresía
              </button>
            </div>
          </form>
        )}

        {/* Master Content Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-main-grid">
          
          {/* Left panel: Withdrawal configs & Calendar (occupies 5 cols of 12) */}
          <div className="lg:col-span-5 space-y-6">
            <WithdrawalCalendar 
              config={withdrawalConfig} 
              onUpdate={handleUpdateWithdrawal} 
            />
            <RegistrationSimulator />
          </div>

          {/* Right panel: Membresías VIP Editor list (occupies 7 cols of 12) */}
          <div className="lg:col-span-7 space-y-4" id="viptier-list-section">
            <div className="flex justify-between items-center pb-2">
              <h3 className="font-display font-semibold text-white text-base">
                Membresías VIP de TAPPMUSIC C ({viptiers.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                Guarda automáticamente al editar
              </span>
            </div>

            {viptiers.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-white/5 space-y-3">
                <span className="text-4xl">🫙</span>
                <p className="text-xs text-slate-400">No hay ninguna membresía VIP configurada en este momento.</p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-xs py-1.5 px-3 rounded-lg"
                >
                  Agregar tu primera membresía
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {viptiers.map(tier => (
                  <VIPTierCard
                    key={tier.id}
                    tier={tier}
                    conversionRate={conversionRate}
                    onUpdate={handleUpdateTier}
                    onDelete={handleDeleteTier}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
        )}

        {/* --- 🎵 CLIENT PLAYER & MICRO-EARNING TASKS COMPONENT (TAB: CLIENT) --- */}
        {activeMainTab === 'client' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="client-playback-workspace">
            
            {/* Left Column: VIP Upgrade Showcase (Only Reels & VIP plans) */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              
              {/* VIP upgrade cards showcase */}
              <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-[#090d16]/95 space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-emerald-400" />
                    Adquirir Rango VIP
                  </h4>
                  <span className="text-[10px] text-slate-500">1 USD = {conversionRate} Monedas</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {viptiers.map(tier => {
                    const isActive = userVIPTier === tier.id;
                    return (
                      <div 
                        key={tier.id} 
                        className={`p-3.5 rounded-xl border transition-all flex justify-between items-center ${
                          isActive 
                            ? 'bg-emerald-500/5 border-emerald-500/30' 
                            : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white leading-none">{tier.name}</span>
                            {isActive && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-1 py-0.2 rounded uppercase">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">{tier.desc}</p>
                          <div className="flex gap-2.5 text-[11px] font-mono text-slate-400">
                            <span>Videos: <strong className="text-emerald-400">{tier.dailyTasks}</strong></span>
                            <span>Premio: <strong className="text-amber-400 font-bold">{tier.reward} {tier.rewardType}</strong></span>
                          </div>
                        </div>

                        <div className="text-right space-y-1.5">
                          <span className="block text-xs font-bold font-mono text-white">${tier.price} USD</span>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetDepositTier(tier);
                                setShowVIPDepositModal(true);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-md transition-all uppercase"
                            >
                              Comprar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Active Video reels and list */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-semibold text-white text-base">Reels de Música Premium</h3>
                  <p className="text-xs text-slate-400">Toca un Reel FHD durante 25 segundos para reclamar tus monedas.</p>
                </div>
                <div className="bg-[#0b101c] border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs">
                  <span className="text-slate-400">Misiones hoy: </span>
                  <strong className="text-emerald-400 font-bold">{completedTasksCount} / {((viptiers.find(t => t.id === userVIPTier)?.dailyTasks) || 1)}</strong>
                </div>
              </div>

              {/* Active Player Box when dynamic stream starts */}
              {isPlayingVideo && selectedReelIdx !== null ? (
                <div className="glass-panel p-5 rounded-2xl border-2 border-emerald-500/40 bg-[#060a12] space-y-4 relative overflow-hidden" id="active-video-player-widget">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                      <span className="text-xs font-bold text-slate-200">Reproduciendo: {REEL_MUSIC_TASKS[selectedReelIdx].title}</span>
                    </div>
                    
                    {/* Time Alert Circle Indicator */}
                    <div className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                      <Clock className="h-3 w-3" />
                      <span>Faltan {videoTimer}s</span>
                    </div>
                  </div>

                  {/* Centered YouTube Video embed container */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 relative">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`${REEL_MUSIC_TASKS[selectedReelIdx].videoUrl}?autoplay=1&mute=1&controls=1&modestbranding=1`}
                      title="Music Reel Player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>

                    {/* Timer progress load indicator bar */}
                    <div className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-1000" style={{ width: `${(25 - videoTimer) * 4}%` }}></div>
                  </div>

                  {/* HIGH-FIDELITY AUDIOVISUAL MOTIVATIONAL DETAIL ("FRASES", "TEMÁTICAS" & SYNCED EQUALIZER) */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-3.5 animate-fade-in shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shadow-sm flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        TEMÁTICA: {REEL_MUSIC_TASKS[selectedReelIdx].category}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono flex items-center gap-1 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
                        <Disc className="h-3 w-3 animate-spin text-emerald-400" style={{ animationDuration: '4s' }} />
                        Sincronización Premium
                      </span>
                    </div>
                    
                    <div className="space-y-1.5 relative pl-3.5 border-l-2 border-emerald-500/40">
                      <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">Frase Transformadora:</h4>
                      <p className="text-sm font-semibold text-white leading-relaxed italic pr-1 select-none">
                        "{REEL_MUSIC_TASKS[selectedReelIdx].quote}"
                      </p>
                    </div>

                    {/* Dynamic Equalizer Bar for deep immersive audio visual feel */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        🔊 Escuchando pista en segundo plano...
                      </span>
                      <div className="flex items-end gap-1 h-3.5 px-1 bg-[#04060a] rounded border border-white/5 select-none shrink-0">
                        <div className="w-[3px] bg-emerald-400 rounded-t animate-bounce" style={{ height: '50%', animationDelay: '0.1s', animationDuration: '0.5s' }}></div>
                        <div className="w-[3px] bg-cyan-400 rounded-t animate-bounce" style={{ height: '90%', animationDelay: '0.3s', animationDuration: '0.3s' }}></div>
                        <div className="w-[3px] bg-emerald-400 rounded-t animate-bounce" style={{ height: '30%', animationDelay: '0.2s', animationDuration: '0.7s' }}></div>
                        <div className="w-[3px] bg-sky-450 rounded-t animate-bounce" style={{ height: '75%', animationDelay: '0.4s', animationDuration: '0.4s' }}></div>
                        <div className="w-[3px] bg-emerald-400 rounded-t animate-bounce" style={{ height: '45%', animationDelay: '0.15s', animationDuration: '0.6s' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 text-xs">
                    <span className="text-[10px] text-slate-400 italic">"No cierres la pantalla para asegurar la recompensa"</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Estás seguro de cancelar? No recibirás ninguna recompensa.")) {
                          setIsPlayingVideo(false);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 font-semibold uppercase text-[10px]"
                    >
                      Cancelar Tarea
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REEL_MUSIC_TASKS.map((task, idx) => {
                    const activeVIPDetails = viptiers.find(t => t.id === userVIPTier) || { id: 'invitado', name: 'Invitado', dailyTasks: 1, reward: 5 };
                    const isLimitReached = completedTasksCount >= (activeVIPDetails.dailyTasks ?? 1);
                    
                    return (
                      <div 
                        key={idx} 
                        className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-[#090d16]/95 hover:border-emerald-500/25 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase border border-emerald-500/15">
                              {task.category}
                            </span>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{task.title}</h4>
                            <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">"{task.quote}"</p>
                          </div>
                        </div>

                        <div className="w-full mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-mono">Recompensa:</span>
                            <span className="text-xs font-bold text-amber-400 font-mono">
                              +{Math.ceil((activeVIPDetails.reward ?? 5) / (activeVIPDetails.dailyTasks ?? 1))} Coins
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isLimitReached}
                            onClick={() => {
                              setSelectedReelIdx(idx);
                              setVideoTimer(25);
                              setIsPlayingVideo(true);
                            }}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              isLimitReached 
                                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950'
                            }`}
                          >
                            <Play className="h-3 w-3 fill-current" />
                            {isLimitReached ? 'Límite diario' : 'Ver Reel FHD'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 👑 REGISTRATION & APPROVAL LOGS (TAB: SUPERADMIN) --- */}
        {activeMainTab === 'superadmin' && (
          <div className="glass-panel p-5 md:p-6 rounded-2xl border border-white/5 bg-[#090d16]/95 space-y-6 animate-fade-in" id="super-admin-layout">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                  <span>Panel Digital de Súper Administrador</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Monitorea las solicitudes de registro, depósitos bancarios de Kervin Jose, y autoriza rangos VIP de clientes en tiempo real.
                </p>
              </div>

              {/* Counter Statistics Badges */}
              <div className="flex flex-wrap gap-2.5 font-mono text-[11px]">
                <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-500 uppercase">Sin Procesar: </span>
                  <strong className="text-amber-400 font-bold">{depositRequestsList.filter(r => r.status === 'pending').length}</strong>
                </div>
                <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-[#10b981] uppercase">Aprobados: </span>
                  <strong className="text-emerald-400 font-bold">{depositRequestsList.filter(r => r.status === 'approved').length}</strong>
                </div>
                <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg col-span-3 sm:col-span-1">
                  <span className="text-slate-500 uppercase">Totales: </span>
                  <strong className="text-slate-300 font-bold">{depositRequestsList.length}</strong>
                </div>
              </div>
            </div>

            {depositRequestsList.length === 0 ? (
              <div className="p-8 text-center border border-white/5 bg-slate-950/20 rounded-2xl space-y-3">
                <span className="text-4xl">🧾</span>
                <p className="text-xs text-slate-400">No se ha registrado ninguna solicitud de depósito de membresía aún.</p>
                <p className="text-[10px] text-slate-500">Úsala como Cliente en la pestaña superior e ingresa comprobantes de prueba para verlos aquí de inmediato.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0c111e] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-light-slate-900 border-white/5">
                      <th className="py-3.5 px-4 font-bold">Cliente / Correo</th>
                      <th className="py-3.5 px-4 font-bold">Membresía</th>
                      <th className="py-3.5 px-4 font-bold text-right">Precio ($ USD)</th>
                      <th className="py-3.5 px-4 font-bold">Comprobante de Referencia</th>
                      <th className="py-3.5 px-4 font-bold">Fecha / Hora</th>
                      <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                      <th className="py-3.5 px-4 font-bold text-center">Acciones de Verificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {depositRequestsList.map((req, index) => (
                      <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{req.username}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.userEmail}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {req.tierName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white text-right">
                          ${req.price} USD
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono leading-relaxed select-all">
                          <code className="bg-slate-950/80 px-2 py-1 rounded border border-white/5 font-bold text-emerald-400">
                            {req.referenceId}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'pending' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                              Pendiente
                            </span>
                          )}
                          {req.status === 'approved' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                              Aprobado
                            </span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                              Rechazado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {req.status === 'pending' ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(req)}
                                className="bg-emerald-500 hover:bg-emerald-450 text-slate-950 py-1 px-2.5 rounded font-bold uppercase text-[9px] shadow hover:shadow-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="h-3 w-3 shrink-0" />
                                Aprobar Pago
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(req)}
                                className="bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-300 py-1 px-2.5 rounded font-mono uppercase text-[9px] transition-all cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <div className="text-slate-500 text-center italic font-mono text-[10px]">
                              Procesado con éxito
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Full-width code output exporter section */}
        <div className="grid grid-cols-1" id="exporter-section">
          <CodeExporter 
            tiers={viptiers} 
            withdrawalConfig={withdrawalConfig} 
            conversionRate={conversionRate} 
          />
        </div>

      </main>

      {/* Humble Footer section with no telemetry larping */}
      <footer className="border-t border-white/5 bg-[#0b0f19] py-6 px-4 text-center mt-12" id="applet-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-xs text-slate-400">TAPPMUSIC C VIP & Withdrawal Consolidation Admin</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            © 2026 TAPPMUSIC C • Desarrollado para Kervin Jose • Guardado Local Seguro
          </span>
        </div>
      </footer>
      
      {/* --- SUCCESS REWARD CLAIM MODAL --- */}
      {showRewardVideoModal && (
        <div className="fixed inset-0 bg-[#04060b]/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]" id="reward-claiming-modal">
          <div className="bg-[#0b121f] border-2 border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-scale-up">
            <div className="mx-auto h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/30 text-emerald-400">
              <Coins className="h-8 w-8 animate-bounce text-emerald-400" />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded uppercase tracking-wider">
                ¡Video Completado!
              </span>
              <h3 className="text-xl font-display font-bold text-white mt-1">Recompensa Acumulada</h3>
              <p className="text-xs text-slate-400">Has visto con éxito los 25 segundos reglamentarios de tu reel FHD.</p>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Monto Ganado</div>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-1 flex items-center justify-center gap-1">
                +{claimVideoRewardAmount}
                <span className="text-xs text-amber-400 font-semibold uppercase">Coins</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRewardVideoModal(false)}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 tracking-wide uppercase cursor-pointer"
            >
              Reclamar y Continuar ✔
            </button>
          </div>
        </div>
      )}

      {/* --- VIP UPGRADE TRANSFER STATUS MODAL --- */}
      {showVIPDepositModal && targetDepositTier && (
        <div className="fixed inset-0 bg-[#04060b]/95 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" id="vip-upgrade-invoice-modal">
          <div className="bg-[#0b0f19]/95 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-white">Solicitar Membresía: {targetDepositTier.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVIPDepositModal(false);
                  setEnteredReferenceProof('');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Para activar el rango <strong className="text-emerald-400">{targetDepositTier.name}</strong>, realiza la transferencia o depósito de <strong className="text-white">${targetDepositTier.price} USD</strong> y adjunta el número o comprobante de tu transacción a continuación.
              </p>

              {/* Informative Invoice details */}
              <div className="bg-[#04070e] p-4 rounded-xl border border-white/5 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Membresía Seleccionada:</span>
                  <span className="text-slate-200">{targetDepositTier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor de Actividad:</span>
                  <span className="text-emerald-400 font-bold">${targetDepositTier.price} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Multiplicador Coins:</span>
                  <span className="text-amber-400">+{Math.floor(targetDepositTier.price * conversionRate)} Monedas</span>
                </div>
              </div>

              {/* Input for proof */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                  Ingresa Referencia o Comprobante de Depósito:
                </label>
                <input
                  type="text"
                  required
                  value={enteredReferenceProof}
                  onChange={(e) => setEnteredReferenceProof(e.target.value)}
                  placeholder="Ej: TRANS-98302-COCO"
                  className="w-full bg-[#04060a] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-650 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 text-[10px] text-slate-400 leading-normal">
                ⚠️ Una vez enviado, podrás revisar e inspeccionar de inmediato esta solicitud para su aprobación o rechazo en la pestaña <strong className="text-purple-400">"Súper-Admin"</strong> del panel digital.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowVIPDepositModal(false);
                  setEnteredReferenceProof('');
                }}
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs py-2 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRequestVIPTier(targetDepositTier, enteredReferenceProof)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-bold text-xs py-2 rounded-lg transition-all cursor-pointer"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Config Modal Dialog */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-[#04060b]/90 backdrop-blur-sm flex items-center justify-center p-4 z-[99]" id="firebase-config-modal">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-fade-in">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                <span>Configurar Códigos de Firebase</span>
              </h3>
              <p className="text-xs text-slate-400">
                Sincroniza y escribe datos directamente en tu consola Firebase de <code className="text-slate-200">tappmusic-e9406</code>.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                  Copia tu Web API Key (apiKey):
                </label>
                <input
                  type="password"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#05070a] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-600 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Este es el valor de <code className="text-slate-300">apiKey</code> que se muestra en tu captura de Configuración del Proyecto (el que tiene el botón de copiar).
                </p>
              </div>

              {/* Show static default project info cards */}
              <div className="bg-[#05070a] p-3.5 border border-white/5 rounded-xl space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID del Proyecto:</span>
                  <span className="text-slate-300 font-bold">tappmusic-e9406</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Número de Proyecto:</span>
                  <span className="text-slate-300">1002591783990</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dominio de Auth:</span>
                  <span className="text-slate-300">tappmusic-e9406.firebaseapp.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID de App:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">1:1002591783990:web:cd4725537c475f8df15c97</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs py-2 rounded-lg transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (apiKeyValue.trim()) {
                    updateFirebaseApiKey(apiKeyValue.trim());
                    setShowConfigModal(false);
                  } else {
                    alert('Por favor ingresa un API Key de tu proyecto Firebase.');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-semibold text-xs py-2 rounded-lg transition-all cursor-pointer"
              >
                Conectar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Error Diagnostic Modal */}
      {authErrorDiagnostics && (
        <div className="fixed inset-0 bg-[#04060b]/95 backdrop-blur-md flex items-center justify-center p-4 z-[100]" id="auth-diagnostics-modal">
          <div className="bg-[#101424] border border-red-500/30 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative animate-fade-in">
            <div className="flex items-start gap-3.5 pb-4 border-b border-white/5">
              <div className="h-10 w-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  Código de Error: {authErrorDiagnostics.code}
                </span>
                <h3 className="font-display font-bold text-base text-white mt-1">
                  Diagnóstico de Conexión Firebase
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-[#05070a] p-3.5 rounded-xl border border-white/5 font-medium">
                {authErrorDiagnostics.message}
              </p>

              <div className="space-y-2">
                <h4 className="text-[11px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                  Sigue estos pasos para solucionarlo:
                </h4>
                <div className="bg-[#05070a] rounded-xl p-4 border border-white/5 space-y-2.5 font-mono text-xs">
                  {authErrorDiagnostics.actionSteps.map((step, idx) => (
                    <div key={idx} className="text-slate-300 leading-normal pl-1.5 border-l-2 border-emerald-500/50 hover:border-emerald-400 transition-all font-sans">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <div className="flex gap-2">
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-center font-bold text-xs py-2.5 rounded-lg transition-all font-mono flex items-center justify-center gap-1.5 shrink-0"
                >
                  Abrir en Pestaña Nueva ⚡
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setAuthErrorDiagnostics(null);
                    signInWithRedirect(auth, googleProvider).catch((e: any) => {
                      console.error("Redirect signin error:", e);
                      alert("Error con redirección: " + (e?.message || e));
                    });
                  }}
                  className="flex-1 bg-sky-500 hover:bg-sky-400 text-white text-center font-bold text-xs py-2.5 rounded-lg transition-all font-mono shrink-0"
                >
                  Modo Redirección 🔄
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthErrorDiagnostics(null)}
                  className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 py-2 rounded-lg transition-all font-semibold font-mono text-center"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthErrorDiagnostics(null);
                    setShowConfigModal(true);
                  }}
                  className="flex-1 bg-slate-800 border border-slate-750 hover:border-slate-700 text-slate-300 py-2 rounded-lg transition-all font-semibold font-mono text-center"
                >
                  Corregir apiKey ⚙️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
