import api from './axios';
export interface CommerceProduct{ id:string;slug:string;translations:Record<string,any>;description?:Record<string,any>;material?:string;salePriceUzs:string|number;compareAtPriceUzs?:string|number;source:string;sourceUrl:string;images:Array<{url:string;alt?:Record<string,string>}>;variants:Array<{id:string;color?:string;size?:string;stock:number;salePriceUzs:string|number}>;category?:{slug:string;name:Record<string,string>} }
export interface ProductPage{items:CommerceProduct[];pagination:{page:number;limit:number;total:number;pages:number}}
export const productTitle=(product:CommerceProduct,locale='ru')=>{const value=product.translations?.[locale]??product.translations?.ru;return typeof value==='string'?value:value?.title??product.slug};
export const getCommerceProducts=async(params:Record<string,unknown>={})=>(await api.get<ProductPage>('/api/v1/products',{params})).data;
export const getCommerceProduct=async(slug:string)=>(await api.get<CommerceProduct>(`/api/v1/products/${encodeURIComponent(slug)}`)).data;
export const createCustomOrder=async(data:{sourceUrl:string;quantity:number;contact:{name:string;phone:string;note?:string}})=>(await api.post('/api/v1/custom-orders',{source:'SOURCE_1688',...data})).data;
