import {
  AsyncStorageItem,
  SecureStorageItem,
} from '@ronas-it/react-native-common-modules/src/data-access/storage';

class AppStorageService {
  public token = new SecureStorageItem('token');
  public tokenExpiresAt = new AsyncStorageItem('tokenExpiresAt');
  public isAuthenticated = new AsyncStorageItem('isAuthenticated');
}

export const appStorageService = new AppStorageService();
