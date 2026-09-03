import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getConfig } from './config.js';
import { makeRoomCode } from './domain.js';

export class SupabaseRepository {
  constructor(config) { this.mode='supabase'; this.supabase=createClient(config.url, config.anonKey); this.user=null; this.room=null; }
  async init(){ let {data}=await this.supabase.auth.getSession(); let user=data.session?.user; if(!user){const r=await this.supabase.auth.signInAnonymously();if(r.error)throw r.error;user=r.data.user;} const {data:p,error}=await this.supabase.from('profiles').select('id,nickname').eq('id',user.id).maybeSingle();if(error)throw error;this.user=p;return p; }
  async getRoom(){ if(!this.user)return null;const {data,error}=await this.supabase.from('room_members').select('room_id,rooms!inner(id,code,name)').eq('user_id',this.user.id).maybeSingle();if(error)throw error;this.room=data?.rooms||null;return this.room; }
  async createRoom(nickname,name){const {data,error}=await this.supabase.rpc('create_room',{p_nickname:nickname,p_room_name:name,p_code:makeRoomCode()});if(error)throw error;const {data:s}=await this.supabase.auth.getSession();this.user={id:s.session.user.id,nickname};this.room=data;return{user:this.user,room:this.room};}
  async joinRoom(nickname,code){const {data,error}=await this.supabase.rpc('join_room',{p_nickname:nickname,p_code:code.trim().toUpperCase()});if(error)throw error;const {data:s}=await this.supabase.auth.getSession();this.user={id:s.session.user.id,nickname};this.room=data;return{user:this.user,room:this.room};}
  async listRequests(){const {data,error}=await this.supabase.from('purchase_requests').select('*').order('created_at',{ascending:false});if(error)throw error;for(const r of data||[]){const urls=[];for(const path of r.images||[]){const {data:s}=await this.supabase.storage.from('product-images').createSignedUrl(path,86400);urls.push(s?.signedUrl||'');}r.images=urls;}return data||[];}
  async createRequest(input){const paths=[];for(const file of input.files||[]){const path=`${this.room.id}/${this.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error}=await this.supabase.storage.from('product-images').upload(path,file);if(error)throw error;paths.push(path);}const payload={room_id:this.room.id,submitter_id:this.user.id,submitter_nickname:this.user.nickname,product_name:input.name.trim(),price:input.price,reason:input.reason.trim(),link:input.link?.trim()||null,images:paths,status:'pending'};const {data,error}=await this.supabase.from('purchase_requests').insert(payload).select().single();if(error)throw error;return data;}
  async approveRequest(id){return this.updateRequest(id,{status:'approved',reject_reason:null});}
  async rejectRequest(id,reason){return this.updateRequest(id,{status:'rejected',reject_reason:reason});}
  async resubmitRequest(id,price,reason){return this.updateRequest(id,{status:'pending',price,reason,reject_reason:null});}
  async markPurchased(id,actualPrice){return this.updateRequest(id,{status:'purchased',actual_price:actualPrice});}
  async updateRequest(id,patch){const {data,error}=await this.supabase.from('purchase_requests').update(patch).eq('id',id).select().single();if(error)throw error;return data;}
  async updateNickname(nickname){const {data,error}=await this.supabase.from('profiles').update({nickname}).eq('id',this.user.id).select().single();if(error)throw error;this.user=data;await this.supabase.from('purchase_requests').update({submitter_nickname:nickname}).eq('submitter_id',this.user.id);return data;}
  async updateRoomName(name){const {data,error}=await this.supabase.from('rooms').update({name}).eq('id',this.room.id).select().single();if(error)throw error;this.room=data;return data;}
  async leaveRoom(){await this.supabase.auth.signOut();}
}

export async function createRepository(){return new SupabaseRepository(getConfig());}
