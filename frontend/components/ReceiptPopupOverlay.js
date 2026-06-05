import React from 'react';
import { observer } from 'mobx-react-lite';
import OverlayStore from '../stores/OverlayStore';
import ReceiptPopup from './ReceiptPopup';

/**
 * ReceiptPopupOverlay — mount once at the app root. Reads receipt state from
 * `OverlayStore` and renders the popup. Consumers anywhere in the app can
 * call `OverlayStore.openReceipt({ title, sections })` to open it; no need
 * to thread state through props.
 */
const ReceiptPopupOverlay = observer(() => (
  <ReceiptPopup
    visible={OverlayStore.receiptVisible}
    onClose={() => OverlayStore.closeReceipt()}
    title={OverlayStore.receiptTitle}
    sections={OverlayStore.receiptSections}
  />
));

export default ReceiptPopupOverlay;
