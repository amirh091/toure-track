const SUPABASE_URL = 'https://mmkmzertihzvezkavxgo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ta216ZXJ0aWh6dmV6a2F2eGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDI4ODAsImV4cCI6MjEwODQxODg4MH0.BnQGNm-IQi4ocW2X_m0_oAxA4Pr5-3KaY9Jx-y2_rqc';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

function afficherNotification(message, type = 'info', duree = 4500) {
    let conteneur = document.getElementById('notification-stack');
    if (!conteneur) {
        conteneur = document.createElement('div');
        conteneur.id = 'notification-stack';
        conteneur.className = 'notification-stack';
        conteneur.setAttribute('aria-live', 'polite');
        conteneur.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(conteneur);
    }

    const styles = {
        success: { icon: '✓', title: 'Terminé' },
        error: { icon: '!', title: 'Une erreur est survenue' },
        warning: { icon: '!', title: 'Attention' },
        info: { icon: 'i', title: 'Information' }
    };
    const style = styles[type] || styles.info;
    const notification = document.createElement('section');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = style.icon;

    const body = document.createElement('div');
    body.className = 'notification-body';
    const heading = document.createElement('strong');
    heading.textContent = style.title;
    const detail = document.createElement('p');
    detail.textContent = message;
    body.append(heading, detail);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'notification-close';
    close.setAttribute('aria-label', 'Fermer la notification');
    close.textContent = '×';

    const dismiss = () => {
        notification.classList.add('notification-leaving');
        notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        window.setTimeout(() => notification.remove(), 250);
    };
    close.addEventListener('click', dismiss);
    notification.append(icon, body, close);
    conteneur.appendChild(notification);

    if (duree > 0) window.setTimeout(dismiss, duree);
}

let compteurDialogues = 0;

function afficherDialogue({ title, message, confirmText = 'Confirmer', cancelText = 'Annuler', danger = false, input = null }) {
    return new Promise(resolve => {
        const identifiant = ++compteurDialogues;
        const focusPrecedent = document.activeElement;
        const backdrop = document.createElement('div');
        backdrop.className = 'dialog-backdrop';
        backdrop.setAttribute('role', 'presentation');

        const dialog = document.createElement('section');
        dialog.className = 'dialog-card';
        dialog.setAttribute('role', input ? 'dialog' : 'alertdialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', `dialog-title-${identifiant}`);
        dialog.setAttribute('aria-describedby', `dialog-message-${identifiant}`);

        const icon = document.createElement('span');
        icon.className = `dialog-icon${danger ? ' dialog-icon-danger' : ''}`;
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = danger ? '!' : '?';

        const heading = document.createElement('h2');
        heading.id = `dialog-title-${identifiant}`;
        heading.textContent = title;

        const description = document.createElement('p');
        description.id = `dialog-message-${identifiant}`;
        description.textContent = message;

        const form = document.createElement('form');
        form.className = 'dialog-form';
        if (input) {
            const field = document.createElement('input');
            field.type = input.type || 'text';
            field.placeholder = input.placeholder || '';
            field.autocomplete = input.autocomplete || 'off';
            field.required = true;
            field.className = 'dialog-input';
            if (input.type === 'email') field.inputMode = 'email';
            if (input.minLength) field.minLength = input.minLength;
            form.appendChild(field);
        }

        const error = document.createElement('p');
        error.id = `dialog-error-${identifiant}`;
        error.className = 'dialog-error';
        error.setAttribute('aria-live', 'polite');
        if (input) form.querySelector('input').setAttribute('aria-describedby', error.id);

        const actions = document.createElement('div');
        actions.className = 'dialog-actions';
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-outline';
        cancel.textContent = cancelText;
        const confirm = document.createElement('button');
        confirm.type = 'submit';
        confirm.className = danger ? 'btn btn-danger dialog-confirm-danger' : 'btn btn-primary';
        confirm.textContent = confirmText;
        actions.append(cancel, confirm);
        form.append(error, actions);
        dialog.append(icon, heading, description, form);
        backdrop.appendChild(dialog);

        let resolved = false;
        const closeDialog = value => {
            if (resolved) return;
            resolved = true;
            document.removeEventListener('keydown', onKeyDown);
            backdrop.classList.add('dialog-backdrop-leaving');
            window.setTimeout(() => backdrop.remove(), 180);
            if (focusPrecedent instanceof HTMLElement && focusPrecedent.isConnected) focusPrecedent.focus();
            resolve(value);
        };
        const onKeyDown = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeDialog(null);
            }
            if (event.key === 'Tab') {
                const controls = [...dialog.querySelectorAll('input, button')].filter(control => !control.disabled);
                if (!controls.length) return;
                if (event.shiftKey && document.activeElement === controls[0]) {
                    event.preventDefault();
                    controls[controls.length - 1].focus();
                } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
                    event.preventDefault();
                    controls[0].focus();
                }
            }
        };

        cancel.addEventListener('click', () => closeDialog(null));
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) closeDialog(null);
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (input) {
                const field = form.querySelector('input');
                if (!field.value.trim()) {
                    error.textContent = 'Ce champ est obligatoire.';
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                    return;
                }
                if (field.type === 'email' && field.validity.typeMismatch) {
                    error.textContent = 'Saisissez une adresse email valide.';
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                    return;
                }
                if (input.minLength && field.value.length < input.minLength) {
                    error.textContent = `Saisissez au moins ${input.minLength} caractères.`;
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                    return;
                }
                if (input.expectedValue && field.value !== input.expectedValue) {
                    error.textContent = input.validationMessage || 'La valeur saisie ne correspond pas.';
                    field.setAttribute('aria-invalid', 'true');
                    field.focus();
                    return;
                }
                closeDialog(field.value);
                return;
            }
            closeDialog(true);
        });
        document.body.appendChild(backdrop);
        document.addEventListener('keydown', onKeyDown);
        window.requestAnimationFrame(() => (form.querySelector('input') || confirm).focus());
    });
}

function confirmerAction(options) {
    return afficherDialogue(options).then(result => result === true);
}

window.afficherNotification = afficherNotification;
window.confirmerAction = confirmerAction;
window.demanderSaisie = options => afficherDialogue({ ...options, input: options.input || {} });
window.notifierEtRediriger = (message, type, destination, duree = 1500) => {
    afficherNotification(message, type);
    window.setTimeout(() => { window.location.href = destination; }, duree);
};

async function deconnexion(event) {
    if (event) event.preventDefault();

    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        afficherNotification("Erreur lors de la déconnexion : " + error.message, 'error');
        return;
    }

    window.location.href = 'connexion.html';
}

async function verifierAdmin() {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
        console.error("Erreur de vérification de la connexion :", authError);
        window.notifierEtRediriger("Erreur : impossible de vérifier votre connexion.", 'error', 'connexion.html');
        return false;
    }

    if (!user) {
        window.location.href = 'connexion.html';
        return false;
    }

    const { data: profil, error: profilError } = await supabaseClient
        .from('profils')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (profilError) {
        console.error("Erreur de vérification du rôle :", profilError);
        window.notifierEtRediriger("Erreur : impossible de vérifier votre rôle.", 'error', 'connexion.html');
        return false;
    }

    if (!profil || profil.role !== 'admin') {
        window.location.href = 'colis.html';
        return false;
    }

    return true;
}

window.deconnexion = deconnexion;
window.verifierAdmin = verifierAdmin;

function toggleMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    if (!sidebar || !menuToggle) return;

    const estOuvert = sidebar.classList.toggle('active');
    document.body.classList.toggle('menu-open', estOuvert);
    menuToggle.classList.toggle('menu-open', estOuvert);
    menuToggle.textContent = estOuvert ? '×' : '☰';
    menuToggle.setAttribute('aria-label', estOuvert ? 'Fermer le menu' : 'Ouvrir le menu');
    menuToggle.setAttribute('aria-expanded', String(estOuvert));
}

window.toggleMenu = toggleMenu;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.sidebar nav a').forEach(lien => {
        lien.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.querySelector('.menu-toggle');
            if (sidebar && menuToggle) {
                sidebar.classList.remove('active');
                document.body.classList.remove('menu-open');
                menuToggle.classList.remove('menu-open');
                menuToggle.textContent = '☰';
                menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    document.addEventListener('click', event => {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        if (!sidebar || !menuToggle || !sidebar.classList.contains('active')) return;
        if (sidebar.contains(event.target) || menuToggle.contains(event.target)) return;

        sidebar.classList.remove('active');
        document.body.classList.remove('menu-open');
        menuToggle.classList.remove('menu-open');
        menuToggle.textContent = '☰';
        menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
        menuToggle.setAttribute('aria-expanded', 'false');
    });

    window.addEventListener('resize', () => {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        if (window.innerWidth > 1024 && sidebar && menuToggle) {
            sidebar.classList.remove('active');
            document.body.classList.remove('menu-open');
            menuToggle.classList.remove('menu-open');
            menuToggle.textContent = '☰';
            menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });

    const horloge = document.getElementById('horloge') || (() => {
        const emplacement = document.querySelector('header') || document.querySelector('.auth-box, .track-box');
        if (!emplacement) return null;

        const element = document.createElement('p');
        element.id = 'horloge';
        element.className = 'app-clock';
        element.setAttribute('aria-label', 'Heure locale');
        if (!document.querySelector('header')) {
            element.classList.add('app-clock-centered');
            emplacement.insertBefore(element, emplacement.children[1] || null);
        } else {
            emplacement.appendChild(element);
        }
        return element;
    })();

    if (horloge) {
        const mettreAJourHeure = () => {
            horloge.textContent = new Date().toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        mettreAJourHeure();
        window.setInterval(mettreAJourHeure, 1000);
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('TOURE-TRACK PWA prête.'))
            .catch(error => console.error('Erreur lors de l’enregistrement du Service Worker :', error));
    });
}