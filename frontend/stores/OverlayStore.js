import { makeAutoObservable } from 'mobx';

/**
 * OverlayStore — global overlay state for cross-cutting popups.
 *
 * The receipt popup is the first consumer: any primitive or button can call
 * `OverlayStore.openReceipt({ title, sections })` and a single mounted
 * `<ReceiptPopup>` near the app root reads from here and renders it. This
 * keeps overlay state out of every consumer's local `useState(open)` mess and
 * makes it possible to enforce "only one popup at a time," queue them, or
 * log open events centrally later.
 *
 * To consume: mount `<ReceiptPopupOverlay />` once at the app root (already
 * wired into the root layout). To open from anywhere:
 *
 *   import OverlayStore from '../stores/OverlayStore';
 *   OverlayStore.openReceipt({ title: 'For Jamie', sections: [...] });
 */
class OverlayStore {
  // Receipt popup
  receiptVisible = false;
  receiptTitle = '';
  receiptSections = [];

  constructor() {
    makeAutoObservable(this);
  }

  openReceipt({ title, sections }) {
    this.receiptTitle = title || 'Your receipt';
    this.receiptSections = Array.isArray(sections) ? sections : [];
    this.receiptVisible = true;
  }

  closeReceipt() {
    this.receiptVisible = false;
    // Don't clear title/sections immediately — let the close animation finish
    // reading them. They'll be overwritten on the next openReceipt.
  }
}

export default new OverlayStore();
