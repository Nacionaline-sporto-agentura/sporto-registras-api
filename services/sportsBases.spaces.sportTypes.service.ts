'use strict';
import moleculer from 'moleculer';
import { Method, Service } from 'moleculer-decorators';
import DbConnection from '../mixins/database.mixin';

import {
  ACTIONS_MUTATE_ADMIN_ONLY,
  COMMON_DEFAULT_SCOPES,
  COMMON_FIELDS,
  COMMON_SCOPES,
  CommonFields,
  CommonPopulates,
  Table,
} from '../types';
import { SportsBasesType } from './sportsBases.types.service';

interface Fields extends CommonFields {
  id: number;
  name: string;
  type: SportsBasesType['id'];
}

interface Populates extends CommonPopulates {}
export type SportBaseSpaceSportType<
  P extends keyof Populates = never,
  F extends keyof (Fields & Populates) = keyof Fields,
> = Table<Fields, Populates, P, F>;
@Service({
  name: 'sportsBases.spaces.sportTypes',
  mixins: [
    DbConnection({
      collection: 'sportsBasesSpacesSportTypes',
    }),
  ],
  settings: {
    fields: {
      id: {
        type: 'string',
        columnType: 'integer',
        primaryKey: true,
        secure: true,
      },

      name: 'string',
      ...COMMON_FIELDS,
    },
    scopes: { ...COMMON_SCOPES },
    defaultScopes: [...COMMON_DEFAULT_SCOPES],
  },
  actions: ACTIONS_MUTATE_ADMIN_ONLY,
})
export default class SportsTypesService extends moleculer.Service {
  @Method
  async seedDB() {
    const data = [
      { name: 'Badmintonas' },
      { name: 'Baidarių ir kanojų irklavimas' },
      { name: 'Banglenčių sportas' },
      { name: 'Beisbolas' },
      { name: 'Beisbolas (softbolas)  (nuo 2020)' },
      { name: 'Biatlonas' },
      { name: 'Bobslėjus' },
      { name: 'Boksas' },
      { name: 'Buriavimas' },
      { name: 'Čiuožimas (dailusis)' },
      { name: 'Čiuožimas (greitasis)' },
      { name: 'Dviračių sportas (plentas)' },
      { name: 'Dviračių sportas (trekas)' },
      { name: 'Dviračių sportas (kalnų)' },
      { name: 'Divarčių sportas (mažųjų dviračių kroso)' },
      { name: 'Dziudo' },
      { name: 'Fechtavimasis' },
      { name: 'Futbolas' },
      { name: 'Gimnastika (sportinė)' },
      { name: 'Gimnastika (meninė)' },
      { name: 'Gimnastika (akr. šuoliai ant batuto)' },
      { name: 'Golfas' },
      { name: 'Imtynės (graikų ir romėnų)' },
      { name: 'Imtynės (laisvosios)' },
      { name: 'Imtynės (moterų)' },
      { name: 'Irklavimas' },
      { name: 'Karatė (WKF)' },
      { name: 'Kerlingas (akmenslydis)' },
      { name: 'Krepšinis' },
      { name: 'Laipiojimo sportas (nuo 2020)' },
      { name: 'Ledo ritulys' },
      { name: 'Lengvoji atletika' },
      { name: 'Plaukimas' },
      { name: 'Plaukimas (sinchroninis)' },
      { name: 'Plaukimas (šuoliai į vandenį)' },
      { name: 'Rankinis' },
      { name: 'Regbis' },
      { name: 'Riedlenčių sportas' },
      { name: 'Rogučių sportas' },
      { name: 'Skeletonas' },
      { name: 'Slidinėjimas (lygūmų)' },
      { name: 'Slidinėjimas (kalnų)' },
      { name: 'Slidinėjimas (snieglenčių)' },
      { name: 'Stalo tenisas' },
      { name: 'Sunkioji atletika' },
      { name: 'Šaudymas iš lanko' },
      { name: 'Šaudymo sportas' },
      { name: 'Šiuolaikinė penkiakovė' },
      { name: 'Tekvondo (WTF)' },
      { name: 'Tenisas' },
      { name: 'Tinklinis' },
      { name: 'Triatlonas' },
      { name: 'Vandensvydis' },
      { name: 'Žirgų sportas' },
      { name: 'Žolės riedulys' },
      { name: 'Kitos sporto šakos' },
      { name: 'Alpinizmas' },
      { name: 'Baidarių (kanu) polo' },
      { name: 'Boulingas' },
      { name: 'Gimnastika (aerobinė)' },
      { name: 'Gimnastika (akr.i šuoliai ant takelio)' },
      { name: 'Gimnastika (sportinė akrobatika)' },
      { name: 'Gimnastika visiems ' },
      { name: 'Biliardas' },
      { name: 'Bočia' },
      { name: 'Džiudžitsu (ju-jitsu)' },
      { name: 'Galiūnų sportas**' },
      { name: 'Imtynės už diržų (Alyšo imtynės)' },
      { name: 'Jėgos trikovė' },
      { name: 'Kendo' },
      { name: 'Kikboksas' },
      { name: 'Kiokušin karatė' },
      { name: 'Kudo' },
      { name: 'Kultūrizmas ir fitnesas (kūno rengyba) (IFBB)' },
      { name: 'Kultūrizmas ir fitnesas (kūno rengyba)  (NABBA, WABBA)**' },
      { name: 'Lietuviškas ritinis**' },
      { name: 'Muay thai' },
      { name: 'Orientavimosi sportas' },
      { name: 'Pankrationas' },
      { name: 'Povandeninis plaukimas' },
      { name: 'Pulas' },
      { name: 'Rankų lenkimas' },
      { name: 'Ringo' },
      { name: 'Sambo' },
      { name: 'Skvošas' },
      { name: 'Sumo' },
      { name: 'Smiginis' },
      { name: 'Sportinė žūklė' },
      { name: 'Sportinė žūklė (kastingas)' },
      { name: 'Sportiniai šokiai' },
      { name: 'Sportinis bridžas' },
      { name: 'Svarsčių kilnojimas' },
      { name: 'Šachmatai' },
      { name: 'Šachmatai susirašinėjant' },
      { name: 'Šachmatų kompozicijos' },
      { name: 'Šaškės' },
      { name: 'Universali kova' },
      { name: 'Ušu' },
      { name: 'Vandens slidės' },
      { name: 'Virvės traukimas' },
      {
        name: 'Kitos dvikovinės sporto šakos ** (JKA karatė, lao tai, niat-nam, šidokan, šotokan karatė,  tekvondo (ITF), tradicinis aikido, tradicinis karatė ir t.t.)',
      },
      {
        name: 'Kitos sporto šakos ar fizinės veiklos ** (bėgimo mėgėjai, keliautojų sportas, dailioji mankša  ir t.t.)',
      },
      { name: 'Aviacijos sporto šakos' },
      { name: 'Akrobatinis skraidymas' },
      { name: 'Aviakonstruktorių pilotų mėgėjų sportas' },
      { name: 'Aviamodelių sportas' },
      { name: 'Karšto oro balionų skraidymas' },
      { name: 'Parašiutų sportas' },
      { name: 'Precizinis skraidymas' },
      { name: 'Sklandymas' },
      { name: 'Skraidyklių ir parasparnių sportas' },
      { name: 'Ultralengvųjų orlaivių pilotų sportas' },
      { name: 'Techninės sporto šakos' },
      { name: 'Automobilių sportas (su kartingu)' },
      { name: 'Motociklų sportas (su motobolu)' },
      { name: 'Motorlaivių sportas' },
      { name: 'Radijo sportas**' },
      {
        name: 'Kitos techninės sporto šakos (greituminių automodelių sportas, traktorių sportas ir t.t.)',
      },
      { name: 'Neįgaliųjų sportas' },
      { name: 'Regėjimo neįgaliųjų' },
      { name: 'Judėjimo neįgaliųjų' },
      { name: 'Klausos neįgaliųjų' },
      { name: 'Intelekto neįgaliųjų' },
    ];

    await this.createEntities(null, data);
  }
}
