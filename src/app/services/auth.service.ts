import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable, of, pipe } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { UsuarioI } from '../models/usuario';
import { EmpresaI } from '../models/empresa';
import { AuthResponseI } from '../models/auth-response';

import { environment } from '../../environments/environment';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    //  ---------- VARIABLES ---------- //
    private baseUrl: string = environment.baseUrl;
    // tslint:disable-next-line:variable-name
    private _usuario!: UsuarioI | EmpresaI;

    private email: string;
    private refreshToken: string;

    get usuario(): UsuarioI | EmpresaI {
        return { ...this._usuario };
    }

    getEmail(): void {
        if (localStorage.getItem('email')) {
            this._usuario = JSON.parse(localStorage.getItem('data'));
            this.email = localStorage.getItem('email');
        }
        localStorage.setItem('tipo', '');
        localStorage.setItem('data', '');
        localStorage.setItem('token', '');
    }

    constructor(private http: HttpClient,
                private router: Router) {
        this.email = '';
        this.refreshToken = '';
        // this.getEmail();
        localStorage.setItem('tipo', '');
        if (localStorage.getItem('data')) {
            this._usuario = JSON.parse(localStorage.getItem('data'));
        }
    }

    //  ---------- QUERY ---------- //
    private postQuery(tipo: string, accion: string, body: UsuarioI | EmpresaI | { email: string }): Observable<AuthResponseI> {

        let token: string;

        if (!localStorage.getItem('token')) {
            token = '';
        } else {
            token = localStorage.getItem('token');
        }

        // Creación y asignación de valores de los headers
        const headers = new HttpHeaders({
            'x-token': token
        });

        // Variable para la assignation de la URL completo
        const url = `${this.baseUrl}/${tipo}/${accion}`;

        // Petition http con la URL completa agregando los headers
        return this.http.post<AuthResponseI>(url, body, { headers })
            .pipe(
                map(response => {
                    console.log(response);
                    if (response.data) {
                        localStorage.setItem('token', response.token);
                        this.email = response.data.email;
                        this.refreshToken = response.refreshToken;
                        this._usuario = response.data;
                        localStorage.setItem('data', JSON.stringify(response.data));
                    }
                    return response;
                })
            );
    }

    private getQuery(tipo: string, accion: string, token?: string): Observable<AuthResponseI> {

        // Si recibimos el token de parametro lo asignamos a nuestro token
        if (token) {
            localStorage.setItem('token', token);
        }

        const headers = new HttpHeaders({
            'x-token': localStorage.getItem('token'),
            email: this.email
        });

        // Variable para la assignation de la URL completo
        const url = `${this.baseUrl}/${tipo}/${accion}`;

        // Petition http con la URL completa agregando los headers
        return this.http.get<AuthResponseI>(url, { headers })
            .pipe(
                map((response) => {
                    console.log(response);
                    if (response.data) {
                        this.email = response.data.email;
                        this.refreshToken = response.refreshToken;
                        this._usuario = response.data;
                        localStorage.setItem('data', JSON.stringify(response.data));
                    }
                    return response;
                })
            );
    }

    private putQuery(tipo: string, accion: string, body: UsuarioI | EmpresaI, token: string): Observable<AuthResponseI> {

        // Si recibimos el token de parametro lo asignamos a nuestro token
        if (token) {
            localStorage.setItem('token', token);
        }

        // Variable para la assignation de la URL completo
        const url = `${this.baseUrl}/${tipo}/${accion}`;

        // Petition http con la URL completa agregando los headers
        return this.http.put<AuthResponseI>(url, body, { headers: { 'x-token': localStorage.getItem('token') } })
            .pipe(
                map((response) => {
                    console.log(response);
                    if (response.data) {
                        this.email = response.data.email;
                        this.refreshToken = response.refreshToken;
                        this._usuario = response.data;
                    }
                    return response;
                })
            );
    }

    //  ---------- VALIDADORES ---------- //
    validarToken(): Observable<boolean> {
        const tipo = localStorage.getItem('tipo');
        if (tipo === '1') {
            return this.getQuery('auth-postulantes', 'renew-token')
                .pipe(
                    map((data: AuthResponseI) => {
                        if (!data.status) {
                            return false;
                        }
                        localStorage.set('token', data.token);
                        return true;
                    }));
        }
        if (tipo === '2') {
            return this.getQuery('auth-empresas', 'renew-token')
                .pipe(
                    map((data: AuthResponseI) => {
                        if (!data.status) {
                            return false;
                        }
                        localStorage.set('token', data.token);
                        return true;
                    }));
        }

        this.router.navigateByUrl('/auth');
    }

    validarEmailValidado(): Observable<boolean> {
        const tipo = localStorage.getItem('tipo');
        if (tipo === '1') {
            return this.getQuery('auth-postulantes', 'renew-token')
                .pipe(
                    map((response: AuthResponseI) => {
                        if (response.data.email_validado) {
                            return true;
                        }
                        return false;
                    }));
        }
        if (tipo === '2') {
            return this.getQuery('auth-empresas', 'renew-token')
                .pipe(
                    map((response: AuthResponseI) => {
                        if (response.data.email_validado) {
                            return true;
                        }
                        return false;
                    }));
        }

        this.router.navigateByUrl('/auth');
    }

    validarPerfil(): Observable<boolean> {
        const tipo = localStorage.getItem('tipo');
        if (tipo === '1') {
            return this.getQuery('postulantes', 'valid-perfil-completo')
                .pipe(
                    map((response: AuthResponseI) => {
                        console.log(response);
                        if (!response.status) {
                            return false;
                        }
                        return response.data;
                    }));
        }
        if (tipo === '2') {
            return this.getQuery('empresas', 'valid-perfil-completo')
                .pipe(
                    map((response: AuthResponseI) => {
                        if (!response.status) {
                            return false;
                        }
                        return response.data;
                    }));
        }
    }

    //  ---------- MÉTODOS GENERALES ---------- //
    logout(): void {
        localStorage.clear();
    }

    verificarEmail(email: string): Observable<AuthResponseI> {

        // Asignar el email a un cuerpo JSON
        const body = {
            email
        };

        return this.postQuery('auth', 'send-email-password', body);
    }

    validarEmail(): Observable<AuthResponseI> {
        // Asignar el email a un cuerpo JSON
        const body = {
            email: this.email,
            tipo: localStorage.getItem('tipo')
        };

        // Petición a la base de datos
        return this.postQuery('auth', 'send-email-valid-email', body);
    }

    //  ---------- ASPIRANTE | USUARIO | POSTULANTE ---------- //
    loginUsuario(form: UsuarioI): Observable<AuthResponseI> {
        localStorage.setItem('tipo', '1');
        return this.postQuery('auth-postulantes', 'login', form);
    }

    registroUsuario(form: UsuarioI): Observable<AuthResponseI> {
        return this.postQuery('auth-postulantes', 'register', form);
    }

    validarEmailUsuario(token: string): Observable<AuthResponseI> {
        return this.getQuery('auth-postulantes', 'valid-email', token);
    }

    renewPasswordUsuario(form: UsuarioI, token: string): Observable<AuthResponseI> {
        return this.putQuery('auth-postulantes', 'renew-pass', form, token);
    }

    //  ---------- EMPRESA ---------- //
    loginEmpresa(form: EmpresaI): Observable<AuthResponseI> {
        localStorage.setItem('tipo', '2');
        return this.postQuery('auth-empresas', 'login', form);
    }

    registroEmpresa(form: EmpresaI): Observable<AuthResponseI> {
        return this.postQuery('auth-empresas', 'register', form);
    }

    validarEmailEmpresa(token: string): Observable<AuthResponseI> {
        return this.getQuery('auth-empresas', 'valid-email', token);
    }

    renewPasswordEmpresa(form: EmpresaI, token: string): Observable<AuthResponseI> {
        return this.putQuery('auth-empresas', 'renew-pass', form, token);
    }

}
