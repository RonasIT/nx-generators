import Cookies from 'js-cookie';
import { isNil } from 'lodash';
import { cookieConfig } from './config';

type Key = keyof typeof cookieConfig.keys;
type Data = Partial<Record<Key, string>>;

export class CookieService {
  public static set(data: Data, options?: Cookies.CookieAttributes): void {
    Object.entries(data).forEach(([key, value]) => {
      if (isNil(value)) {
        CookieService.remove([key as Key]);
      } else {
        Cookies.set(key, value, options);
      }
    });
  }

  public static get(key: Key): string {
    return Cookies.get(key) || '';
  }

  public static remove(keys: Array<Key>, options?: Cookies.CookieAttributes): void {
    for (const key of keys) {
      Cookies.remove(key, options);
    }
  }
}
