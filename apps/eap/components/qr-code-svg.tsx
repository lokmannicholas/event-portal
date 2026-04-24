import QRCode from 'qrcode';

export async function QrCodeSvg(props: { value: string; size?: number; label?: string }) {
  const svg = await QRCode.toString(props.value, {
    type: 'svg',
    width: props.size ?? 144,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return (
    <div
      className="portal-qr-code"
      aria-label={props.label ?? 'QR code'}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
