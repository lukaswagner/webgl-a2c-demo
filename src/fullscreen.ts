interface VendorPrefixedDocument extends Document {
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitCancelFullScreen?: () => Promise<void>;
    msFullscreenElement?: Element;
    webkitIsFullScreen?: boolean;
    mozFullScreenElement?: Element;
}

interface VendorPrefixedHTMLElement extends HTMLElement {
    msRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullScreen?: () => Promise<void>;
}

// The vendor prefixing is based on:
// https://hacks.mozilla.org/2012/01/using-the-fullscreen-api-in-web-browsers/

function isFull(): boolean {
    const documentPrefixed = document as VendorPrefixedDocument;
    return !!documentPrefixed.fullscreenElement ||
        !! documentPrefixed.mozFullScreenElement ||
        documentPrefixed.webkitIsFullScreen ||
        !!documentPrefixed.msFullscreenElement;
}

export function setFullscreen(
    elem: VendorPrefixedHTMLElement,
    full = true
): void {
    const documentPrefixed = document as VendorPrefixedDocument;
    if (full) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else if (isFull()) {
        if (documentPrefixed.exitFullscreen) {
            documentPrefixed.exitFullscreen();
        } else if (documentPrefixed.mozCancelFullScreen) {
            documentPrefixed.mozCancelFullScreen();
        } else if (documentPrefixed.webkitCancelFullScreen) {
            documentPrefixed.webkitCancelFullScreen();
        } else if (documentPrefixed.msExitFullscreen) {
            documentPrefixed.msExitFullscreen();
        }
    }
}

export function toggleFullscreen(elem: HTMLElement): void {
    setFullscreen(elem, !isFull());
}

export function setupFullscreen(
    elem: HTMLElement, event = 'dblclick'
): void {
    elem.addEventListener(event, () => toggleFullscreen(elem));
}