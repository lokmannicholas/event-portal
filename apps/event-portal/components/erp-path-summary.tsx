import type { PortalLanguage } from '../lib/portal-language';
import { CopyUrlButton } from './copy-url-button';
import { QrCodeSvg } from './qr-code-svg';

export async function ErpPathSummary(props: { url: string; language?: PortalLanguage }) {
  return (
    <div className="portal-path-summary">
      <div className="portal-path-summary-row">
        <a href={props.url}>{props.url}</a>
        <CopyUrlButton value={props.url} label={props.language === 'zh-Hant' ? '複製 ERP 路徑' : 'Copy ERP path'} language={props.language} />
      </div>
      <QrCodeSvg value={props.url} label={props.language === 'zh-Hant' ? 'ERP 路徑二維碼' : 'ERP path QR code'} />
    </div>
  );
}
