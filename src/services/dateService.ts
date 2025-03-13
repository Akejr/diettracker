// Singleton para gerenciar o estado da data em toda a aplicação
class DateService {
  private static instance: DateService;
  private currentDate: Date | null = null;
  private subscribers: ((date: Date) => void)[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private lastFetchTime: number = 0;
  private readonly FETCH_COOLDOWN = 60000; // 1 minuto em milissegundos
  private readonly TIME_API_URL = 'https://timeapi.io/api/Time/current/zone?timeZone=America/Sao_Paulo';

  private constructor() {
    // Inicializa com a data local ajustada para São Paulo (UTC-3)
    const now = new Date();
    now.setHours(now.getHours() - 3); // Ajusta para UTC-3 (São Paulo)
    this.currentDate = now;
  }

  static getInstance(): DateService {
    if (!DateService.instance) {
      DateService.instance = new DateService();
    }
    return DateService.instance;
  }

  async fetchServerDate(force: boolean = false): Promise<Date> {
    const now = Date.now();
    
    // Se não forçar a atualização e já buscou recentemente, retorna a data atual
    if (!force && this.currentDate && (now - this.lastFetchTime) < this.FETCH_COOLDOWN) {
      return this.currentDate;
    }

    try {
      const response = await fetch(this.TIME_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const serverDate = new Date(data.dateTime);
      
      // Verifica se a data obtida é válida
      if (isNaN(serverDate.getTime())) {
        throw new Error('Invalid date received from server');
      }

      this.currentDate = serverDate;
      this.lastFetchTime = now;
      this.notifySubscribers();
      this.startAutoUpdate();
      return serverDate;
    } catch (error) {
      console.warn("Fallback to local time:", error);
      // Se já tiver uma data, mantém ela
      if (!this.currentDate) {
        const fallbackDate = new Date();
        fallbackDate.setHours(fallbackDate.getHours() - 3); // Ajusta para UTC-3 (São Paulo)
        this.currentDate = fallbackDate;
      }
      this.startAutoUpdate();
      return this.currentDate;
    }
  }

  private startAutoUpdate() {
    // Limpa o intervalo anterior se existir
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Atualiza a data a cada minuto
    this.updateInterval = setInterval(() => {
      if (this.currentDate) {
        // Se falhar em buscar do servidor, incrementa a data local
        this.fetchServerDate().catch(() => {
          this.currentDate = new Date(this.currentDate!.getTime() + 60000);
          this.notifySubscribers();
        });
      }
    }, 60000); // 1 minuto
  }

  getCurrentDate(): Date {
    if (!this.currentDate) {
      this.currentDate = new Date();
      // Tenta buscar a data do servidor em background
      this.fetchServerDate();
    }
    return this.currentDate;
  }

  subscribe(callback: (date: Date) => void) {
    this.subscribers.push(callback);
    // Notifica imediatamente com a data atual
    if (this.currentDate) {
      callback(this.currentDate);
    }
    // Retorna uma função para cancelar a inscrição
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
      // Se não houver mais inscritos, limpa o intervalo
      if (this.subscribers.length === 0 && this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    };
  }

  private notifySubscribers() {
    if (this.currentDate) {
      this.subscribers.forEach(callback => callback(this.currentDate!));
    }
  }

  // Métodos úteis para formatação
  formatDate(date: Date = this.getCurrentDate()): string {
    return date.toISOString().split('T')[0];
  }

  getDay(date: Date = this.getCurrentDate()): number {
    return date.getDate();
  }

  getMonth(date: Date = this.getCurrentDate()): number {
    return date.getMonth();
  }

  getYear(date: Date = this.getCurrentDate()): number {
    return date.getFullYear();
  }
}

export const dateService = DateService.getInstance(); 