import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { getNativeDeviceFingerprint } from './device-fingerprint';
describe('platform device fingerprint',()=>{
 const original=Platform.OS;
 afterEach(()=>{Object.defineProperty(Platform,'OS',{value:original,configurable:true});jest.clearAllMocks();});
 function platform(value:string){Object.defineProperty(Platform,'OS',{value,configurable:true});}
 it('uses the Android platform identifier rather than app storage',async()=>{
   platform('android');(Application.getAndroidId as jest.Mock).mockReturnValue('abc0123456789def');
   expect(await getNativeDeviceFingerprint()).toEqual({platform:'android',rawVendorId:'abc0123456789def'});
   expect(await getNativeDeviceFingerprint()).toEqual({platform:'android',rawVendorId:'abc0123456789def'});
 });
 it('uses iOS IDFV',async()=>{
   platform('ios');(Application.getIosIdForVendorAsync as jest.Mock).mockResolvedValue('5C718C7B-322B-4716-A65C-7D16D5DEEE11');
   expect((await getNativeDeviceFingerprint())?.platform).toBe('ios');expect(Application.getIosIdForVendorAsync).toHaveBeenCalledTimes(1);
 });
 it('fails closed when the platform identifier is unavailable',async()=>{
   platform('ios');(Application.getIosIdForVendorAsync as jest.Mock).mockResolvedValue(null);
   await expect(getNativeDeviceFingerprint()).rejects.toThrow(/unavailable/);
 });
 it('does not invent a native identity on the web',async()=>{
   platform('web');expect(await getNativeDeviceFingerprint()).toBeUndefined();expect(Application.getAndroidId).not.toHaveBeenCalled();
 });
});
