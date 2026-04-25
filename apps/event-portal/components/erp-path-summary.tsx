import { CopyUrlButton } from './copy-url-button';
import { QrCodeSvg } from './qr-code-svg';

export async function ErpPathSummary(props: { url: string }) {
  return (
    <div className="portal-path-summary">
      <div className="portal-path-summary-row">
        <a href={props.url}>{props.url}</a>
        <CopyUrlButton value={props.url} label="Copy ERP path" />
      </div>
      <QrCodeSvg value={props.url} label="ERP path QR code" />
    </div>
  );
}
