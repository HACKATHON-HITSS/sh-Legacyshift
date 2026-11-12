import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router';
import { filter, map } from 'rxjs/operators';

import { AppLoadingService } from '../../core/services/app-loading.service';
import { AuthService } from '../../core/services/auth.service';

type DashboardMenuItem = {
  readonly path: string;
  readonly label: string;
  readonly description: string;
  readonly icon:
    | 'dashboard'
    | 'pull-requests'
    | 'shield'
    | 'beaker'
    | 'sparkles'
    | 'history'
    | 'repositories'
    | 'metrics'
    | 'settings';
  readonly route?: string;
};

type DashboardInfoItem = {
  readonly label: string;
  readonly value: string;
};

type DashboardMenuGroup = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: DashboardMenuItem['icon'];
  readonly items: readonly DashboardMenuItem[];
};

const menuSubsetMatch = {
  paths: 'subset' as const,
  queryParams: 'ignored' as const,
  fragment: 'ignored' as const,
  matrixParams: 'ignored' as const
};

function navUrlMatchesMenuPath(navUrl: string, menuPath: string): boolean {
  const pathOnly = navUrl.split(/[?#]/)[0];
  return pathOnly === menuPath || pathOnly.startsWith(`${menuPath}/`);
}

function isRemoteTemplateDestination(navUrl: string): boolean {
  const pathOnly = navUrl.split(/[?#]/)[0];
  return ['/default', '/template', '/hallazgos', '/cobertura', '/asistente', '/historial', '/proyectos', '/reportes', '/configuracion', '/codigo-fuente', '/analisis', '/decisiones'].some(path => pathOnly === path || pathOnly.startsWith(path + '/'));
}

type ShellBreadcrumbItem = {
  readonly label: string;
  readonly href?: string;
  readonly active?: boolean;
};

const BREADCRUMB_SEGMENT_LABELS: Readonly<Record<string, string>> = {
  default: 'Inicio',
  template: 'Pull Requests',
  hallazgos: 'Hallazgos y vulnerabilidades',
  cobertura: 'Cobertura de pruebas',
  asistente: 'Asistente de revisión',
  historial: 'Historial y comparaciones',
  proyectos: 'Proyectos y repositorios',
  reportes: 'Reportes y métricas',
  configuracion: 'Configuración',
  'codigo-fuente': 'Código fuente',
  analisis: 'Análisis',
  decisiones: 'Decisiones'
};

function buildBreadcrumbItems(pathname: string): readonly ShellBreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [{ label: 'Inicio', active: true }];
  }

  const items: ShellBreadcrumbItem[] = [];
  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    acc += `/${segment}`;
    const isLast = i === segments.length - 1;
    const label =
      BREADCRUMB_SEGMENT_LABELS[segment] ??
      segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    if (isLast) {
      items.push({ label, active: true });
    } else {
      items.push({ label, href: acc });
    }
  }

  return items;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, RouterLink, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full'
  },
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly appLoading = inject(AppLoadingService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly pendingNavUrl = signal<string | null>(null);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.pendingNavUrl.set(event.url);
        if (!isRemoteTemplateDestination(event.url)) {
          this.appLoading.setRemoteLoading(false);
        }
      } else if (event instanceof NavigationEnd) {
        this.pendingNavUrl.set(null);
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (!isRemoteTemplateDestination(path)) {
          this.appLoading.setRemoteLoading(false);
        }
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.pendingNavUrl.set(null);
        this.appLoading.setRemoteLoading(false);
      }
    });
  }

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0] || '/')
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] || '/' }
  );

  readonly breadcrumbItems = computed(() => buildBreadcrumbItems(this.currentPath()));

  readonly mobileBreadcrumbBack = computed((): { readonly label: string; readonly href: string } | null => {
    const items = [...buildBreadcrumbItems(this.currentPath())];
    if (items.length < 2) {
      return null;
    }
    const parent = items[items.length - 2];
    const href = parent.href;
    if (!href) {
      return null;
    }
    return { label: parent.label, href };
  });

  readonly shellInfo: readonly DashboardInfoItem[] = [
    {
      label: 'Aplicación',
      value: 'Legacyshift'
    },
    {
      label: 'Ruta base',
      value: '/'
    },
    {
      label: 'Autenticación',
      value: 'Sesión de demostración'
    }
  ];

  readonly menuGroups: readonly DashboardMenuGroup[] = [
    {
      id: 'codigo-fuente',
      label: '1. Código fuente',
      description: 'Ingreso del proyecto legado',
      icon: 'repositories',
      items: [
        { path: '/codigo-fuente/proyecto', label: 'Crear o seleccionar proyecto', description: 'Proyecto de trabajo', icon: 'dashboard', route: '/codigo-fuente/proyecto' }
      ]
    },
    {
      id: 'analisis',
      label: '2. Análisis',
      description: 'Descubrimiento y diagnóstico',
      icon: 'metrics',
      items: [
        { path: '/analisis/reglas', label: 'Matriz de reglas de negocio', description: 'Reglas extraídas del código', icon: 'dashboard', route: '/analisis/reglas' },
    /*     { path: '/analisis/logica', label: 'Lógica y flujos de negocio', description: 'Procesos y comportamiento', icon: 'pull-requests', route: '/analisis/logica' }, */
/*         { path: '/analisis/condiciones', label: 'Condiciones funcionales y técnicas', description: 'Restricciones y validaciones', icon: 'settings', route: '/analisis/condiciones' }, */
        { path: '/analisis/entradas-salidas', label: 'Entradas y salidas', description: 'Contratos y datos intercambiados', icon: 'pull-requests', route: '/analisis/entradas-salidas' },
        { path: '/analisis/datos-hardcodeados', label: 'Datos y valores hardcodeados', description: 'Valores fijos en el código', icon: 'beaker', route: '/analisis/datos-hardcodeados' },
        { path: '/analisis/deuda-tecnica', label: 'Deuda técnica y código innecesario', description: 'Calidad y código en desuso', icon: 'beaker', route: '/analisis/deuda-tecnica' },
        { path: '/analisis/vulnerabilidades', label: 'Vulnerabilidades y riesgos', description: 'Hallazgos de seguridad', icon: 'shield', route: '/analisis/vulnerabilidades' },
    /*     { path: '/analisis/dependencias', label: 'Dependencias', description: 'Librerías y componentes a migrar', icon: 'repositories', route: '/analisis/dependencias' }, */
    /*     { path: '/analisis/arquitectura', label: 'Arquitectura actual y diagramas', description: 'Estructura y relaciones', icon: 'dashboard', route: '/analisis/arquitectura' } */
      ]
    },
    {
      id: 'decisiones',
      label: '3. Decisiones',
      description: 'Validación y destino de migración',
      icon: 'shield',
      items: [
       /*  { path: '/decisiones/aprobar-reglas', label: 'Revisar y aprobar reglas', description: 'Validación de reglas de negocio', icon: 'shield', route: '/decisiones/aprobar-reglas' }, */
      /*   { path: '/decisiones/tecnologia', label: 'Tecnología de destino', description: 'Selección del stack a migrar', icon: 'settings', route: '/decisiones/tecnologia' }, */
        { path: '/decisiones/arquitectura', label: 'Arquitectura objetivo', description: 'Diseño de la solución futura', icon: 'dashboard', route: '/decisiones/arquitectura' },
        { path: '/decisiones/chat', label: 'Chat sobre reglas y dudas', description: 'Consulta con el asistente', icon: 'sparkles', route: '/decisiones/chat' },
    /*     { path: '/decisiones/exportar', label: 'Exportar documentación y matrices', description: 'Entregables del análisis', icon: 'metrics', route: '/decisiones/exportar' } */
      ]
    }
  ];

  readonly isRemoteLoading = this.appLoading.remoteLoading;

  isMenuItemActive(item: DashboardMenuItem): boolean {
    const pending = this.pendingNavUrl();
    if (pending !== null) {
      return navUrlMatchesMenuPath(pending, item.path);
    }
    return this.router.isActive(item.path, menuSubsetMatch);
  }

  logout(): void {
    this.authService.logout();
  }

  get userName(): string {
    const user = this.authService.getUser();
    return this.getStringValue(user, ['name', 'preferred_username', 'given_name']) ?? 'Administrador';
  }

  get userEmail(): string {
    const user = this.authService.getUser();
    return this.getStringValue(user, ['email']) ?? 'admin@example.com';
  }

  private getStringValue(user: Record<string, unknown>, keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = user[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }
}
