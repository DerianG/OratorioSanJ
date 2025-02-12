import { Component } from '@angular/core';
import { AlertService } from '../../data-access/alert.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alertas.component.html',
  styles: ``
})
export class AlertasComponent {
  constructor(public alertaService: AlertService) {}
}
