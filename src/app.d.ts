import {
	Session,
	SupabaseClient,
	type AMREntry,
	Session,
	SupabaseClient,
	type AMREntry,
	type User,
} from '@supabase/supabase-js';
import type { KVNamespace } from '@cloudflare/workers-types'; // Added import
import Stripe from 'stripe';
import 'unplugin-icons/types/svelte';
import { Database } from './DatabaseDefinitions';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			supabaseServiceRole: SupabaseClient<Database>;
			user: User | null; // Add user property for authenticated user
			safeGetSession: () => Promise<{
				session: Session | null;
				user: User | null;
				amr: AMREntry[] | null;
			}>;
			stripe: Stripe;
		}
		interface PageData {
			session: Session | null;
		}
		// interface Error {}
		interface Platform {
			env: {
				REVIEWS_KV: KVNamespace;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
