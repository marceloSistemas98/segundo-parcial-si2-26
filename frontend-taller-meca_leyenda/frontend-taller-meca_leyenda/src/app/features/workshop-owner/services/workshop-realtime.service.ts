import { Injectable, inject } from '@angular/core';
import { PanelRealtimeService } from '../../../core/services/panel-realtime.service';

/** @deprecated Usar PanelRealtimeService directamente. Wrapper por compatibilidad. */
@Injectable({ providedIn: 'root' })
export class WorkshopRealtimeService {
  private readonly panel = inject(PanelRealtimeService);

  readonly userEvent$ = this.panel.userEvent$;

  start(): Promise<void> {
    return this.panel.start();
  }

  stop(): void {
    this.panel.stop();
  }
}
