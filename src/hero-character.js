import { createAvatarBody, walkPath } from './avatar-body.js';
import { loadApprovedHead } from './approved-avatar.js';
export { walkPath };
export async function createHeroCharacter(helpers,seated=false){
  const headTemplate=await loadApprovedHead();
  return createAvatarBody({...helpers,headTemplate},seated);
}
