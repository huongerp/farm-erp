/**
 * Đăng nhập Google bằng Google Identity Services (luồng ID token).
 *
 * Chọn luồng này thay vì authorization-code redirect vì nó KHÔNG cần client
 * secret và không cần khai redirect URI — chỉ cần thêm domain vào "Authorized
 * JavaScript origins" của OAuth client. Trình duyệt nhận ID token rồi gửi cho
 * auth-service; chữ ký RS256 được xác minh ở đó, tuyệt đối không tin ở client.
 *
 * Google yêu cầu dùng nút do họ render (`renderButton`) cho luồng này, nên nút
 * Google trên trang đăng nhập là nút chuẩn của Google chứ không phải nút tự vẽ.
 */
import { GOOGLE_CLIENT_ID } from './api-config';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type CauHinhNut = {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  locale?: string;
  logo_alignment?: 'left' | 'center';
};

type GoogleIdApi = {
  initialize: (opts: {
    client_id: string;
    callback: (res: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (el: HTMLElement, opts: CauHinhNut) => void;
  disableAutoSelect: () => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

export function googleDaCauHinh(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

let napScriptPromise: Promise<GoogleIdApi> | null = null;

function napScript(): Promise<GoogleIdApi> {
  napScriptPromise ??= new Promise<GoogleIdApi>((resolve, reject) => {
    const sanSang = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error('Script Google đã tải nhưng không thấy accounts.id.'));
    };

    const daCo = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (daCo) {
      if (window.google?.accounts?.id) return sanSang();
      daCo.addEventListener('load', sanSang, { once: true });
      daCo.addEventListener('error', () => reject(new Error('Không tải được script Google.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', sanSang, { once: true });
    script.addEventListener('error', () => reject(new Error('Không tải được script Google.')), { once: true });
    document.head.appendChild(script);
  }).catch((err) => {
    // Cho phép thử lại ở lần render sau (vd mạng chập chờn lúc mở trang).
    napScriptPromise = null;
    throw err;
  });

  return napScriptPromise;
}

/**
 * Vẽ nút "Đăng nhập bằng Google" vào phần tử cho trước.
 * `onIdToken` nhận ID token thô để gửi lên auth-service.
 */
export async function veNutGoogle(
  el: HTMLElement,
  onIdToken: (idToken: string) => void,
  cauHinh: CauHinhNut = {}
): Promise<void> {
  if (!googleDaCauHinh()) throw new Error('Chưa cấu hình VITE_GOOGLE_CLIENT_ID.');

  const api = await napScript();
  api.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (res) => {
      if (res.credential) onIdToken(res.credential);
    },
    // Không tự đăng nhập lại: người dùng phải chủ động bấm.
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  el.replaceChildren();
  api.renderButton(el, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'center',
    locale: 'vi',
    ...cauHinh,
  });
}

/** Gọi khi đăng xuất để Google không tự chọn lại tài khoản cũ. */
export function tatTuChonGoogle(): void {
  try {
    window.google?.accounts?.id?.disableAutoSelect();
  } catch {
    /* script chưa nạp — không sao */
  }
}
