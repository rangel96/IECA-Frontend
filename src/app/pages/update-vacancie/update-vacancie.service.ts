import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class UpdateVacancieService {

  constructor(private http: HttpClient) { }

  getPerfilesVacante(idVacante) {
    return this.http.get(`${baseUrl}/perfiles/vacante/${idVacante}`);
  }

  getPostulantesVacante(idVacante) {
    return this.http.get(`${baseUrl}/vacantes/postulantes/${idVacante}`);
  }

  aceptarPostulacion(idPostulacion) {
    return this.http.get(`${baseUrl}/postulaciones/aceptar/${idPostulacion}`);
  }

  rechazarPostulacion(idPostulacion) {
    return this.http.get(`${baseUrl}/postulaciones/rechazar/${idPostulacion}`);
  }
}
