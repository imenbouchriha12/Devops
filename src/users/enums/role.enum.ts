// src/users/enums/role.enum.ts
export enum Role {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',//moula el saas kolha yaani moula noventra
  BUSINESS_OWNER = 'BUSINESS_OWNER', //moula el businesses ya3ni eli 3enda tenant w ta7tha el businesses mta3ou
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',//role ynjm yatih el business_owner l enses bch ytlhelou bl businesses maaou 
  ACCOUNTANT = 'ACCOUNTANT',// el comptabli eli ytlhe bl 7sebet
  TEAM_MEMBER = 'TEAM_MEMBER', // employé wla mouwadhef 3adi aandou des priviliege mou3aynin (low level)
  CLIENT = 'CLIENT', //client w aandou dashboard wahdou
  SUPPLIER = 'SUPPLIER', //el fournisseur mta3 sel3a 
}