PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "PurchaseCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "PurchaseCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO PurchaseCard VALUES('ffed9092-0dc5-47d6-a73f-87bd00197866','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-11','Amoonguss ex','11','{"small":"https://images.pokemontcg.io/sv9/11.png","large":"https://images.pokemontcg.io/sv9/11_hires.png"}','2026-01-15T00:01:53.126+00:00',1);
INSERT INTO PurchaseCard VALUES('8ea24bf2-acb4-47c2-8cca-c94bd0bcfa6e','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-21','Magmortar','21','{"small":"https://images.pokemontcg.io/sv9/21.png","large":"https://images.pokemontcg.io/sv9/21_hires.png"}','2026-01-15T00:01:53.136+00:00',1);
INSERT INTO PurchaseCard VALUES('c77a4268-e752-48c4-a586-cdd54d8f6865','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-30','Reshiram ex','30','{"small":"https://images.pokemontcg.io/sv9/30.png","large":"https://images.pokemontcg.io/sv9/30_hires.png"}','2026-01-15T00:01:53.147+00:00',1);
INSERT INTO PurchaseCard VALUES('27641959-eff4-4fac-9f43-f9b5ee373ea1','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-31','Volcanion ex','31','{"small":"https://images.pokemontcg.io/sv9/31.png","large":"https://images.pokemontcg.io/sv9/31_hires.png"}','2026-01-15T00:01:53.154+00:00',1);
INSERT INTO PurchaseCard VALUES('09b08d97-64d6-4c5c-8657-ed6806bf852f','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-36','Lombre','36','{"small":"https://images.pokemontcg.io/sv9/36.png","large":"https://images.pokemontcg.io/sv9/36_hires.png"}','2026-01-15T00:01:53.162+00:00',1);
INSERT INTO PurchaseCard VALUES('35b560c6-b3b2-4169-91ce-f6f342c33158','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-37','Ludicolo','37','{"small":"https://images.pokemontcg.io/sv9/37.png","large":"https://images.pokemontcg.io/sv9/37_hires.png"}','2026-01-15T00:01:53.167+00:00',1);
INSERT INTO PurchaseCard VALUES('7d322a6e-da6c-43bc-94e4-19c01f384431','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-40','Wailmer','40','{"small":"https://images.pokemontcg.io/sv9/40.png","large":"https://images.pokemontcg.io/sv9/40_hires.png"}','2026-01-15T00:01:53.173+00:00',1);
INSERT INTO PurchaseCard VALUES('4de73d73-b3ec-40e6-901c-2581d6c65782','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-43','Veluza ex','43','{"small":"https://images.pokemontcg.io/sv9/43.png","large":"https://images.pokemontcg.io/sv9/43_hires.png"}','2026-01-15T00:01:53.179+00:00',1);
INSERT INTO PurchaseCard VALUES('9f3e0938-ea40-4315-a117-03bd1332211c','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-47','Iono''s Voltorb','47','{"small":"https://images.pokemontcg.io/sv9/47.png","large":"https://images.pokemontcg.io/sv9/47_hires.png"}','2026-01-15T00:01:53.184+00:00',1);
INSERT INTO PurchaseCard VALUES('8e55b99d-0121-414d-9322-db40d95d9871','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-54','Iono''s Wattrel','54','{"small":"https://images.pokemontcg.io/sv9/54.png","large":"https://images.pokemontcg.io/sv9/54_hires.png"}','2026-01-15T00:01:53.191+00:00',1);
INSERT INTO PurchaseCard VALUES('04710244-bb88-4a72-a384-e3d487f58393','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-53','Iono''s Bellibolt ex','53','{"small":"https://images.pokemontcg.io/sv9/53.png","large":"https://images.pokemontcg.io/sv9/53_hires.png"}','2026-01-15T00:01:53.197+00:00',1);
INSERT INTO PurchaseCard VALUES('578da9a1-021a-4b8c-be02-16b9e1db048a','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-52','Iono''s Tadbulb','52','{"small":"https://images.pokemontcg.io/sv9/52.png","large":"https://images.pokemontcg.io/sv9/52_hires.png"}','2026-01-15T00:01:53.203+00:00',1);
INSERT INTO PurchaseCard VALUES('9a262f79-f1b3-4e4a-9399-5f2c061dd366','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-65','Oricorio','65','{"small":"https://images.pokemontcg.io/sv9/65.png","large":"https://images.pokemontcg.io/sv9/65_hires.png"}','2026-01-15T00:01:53.208+00:00',1);
INSERT INTO PurchaseCard VALUES('cafd0d65-ae10-4a2a-a0e6-414f07195460','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-66','Lillie''s Cutiefly','66','{"small":"https://images.pokemontcg.io/sv9/66.png","large":"https://images.pokemontcg.io/sv9/66_hires.png"}','2026-01-15T00:01:53.213+00:00',1);
INSERT INTO PurchaseCard VALUES('3b28c733-d576-49ff-a10c-d53f96cc4834','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-68','Lillie''s Comfey','68','{"small":"https://images.pokemontcg.io/sv9/68.png","large":"https://images.pokemontcg.io/sv9/68_hires.png"}','2026-01-15T00:01:53.219+00:00',1);
INSERT INTO PurchaseCard VALUES('bde74f8a-5b9e-433d-bdbc-c8d07f095249','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-69','Mimikyu ex','69','{"small":"https://images.pokemontcg.io/sv9/69.png","large":"https://images.pokemontcg.io/sv9/69_hires.png"}','2026-01-15T00:01:53.224+00:00',1);
INSERT INTO PurchaseCard VALUES('69c961a2-5d1d-44d8-81e3-71a90c911869','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-73','Grimmsnarl','73','{"small":"https://images.pokemontcg.io/sv9/73.png","large":"https://images.pokemontcg.io/sv9/73_hires.png"}','2026-01-15T00:01:53.230+00:00',1);
INSERT INTO PurchaseCard VALUES('d299c430-4ece-4634-b197-3b478d467a46','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-75','Alcremie ex','75','{"small":"https://images.pokemontcg.io/sv9/75.png","large":"https://images.pokemontcg.io/sv9/75_hires.png"}','2026-01-15T00:01:53.235+00:00',1);
INSERT INTO PurchaseCard VALUES('e76d68f8-a5a2-437d-9f88-fb8a83aeb802','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-85','Lycanroc','85','{"small":"https://images.pokemontcg.io/sv9/85.png","large":"https://images.pokemontcg.io/sv9/85_hires.png"}','2026-01-15T00:01:53.240+00:00',1);
INSERT INTO PurchaseCard VALUES('e669518f-d233-4bb2-9a06-bc20f8614727','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-86','Hop''s Silicobra','86','{"small":"https://images.pokemontcg.io/sv9/86.png","large":"https://images.pokemontcg.io/sv9/86_hires.png"}','2026-01-15T00:01:53.244+00:00',1);
INSERT INTO PurchaseCard VALUES('c178d2ff-d36d-41c5-be76-5aab0a427db3','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-96','N''s Purrloin','96','{"small":"https://images.pokemontcg.io/sv9/96.png","large":"https://images.pokemontcg.io/sv9/96_hires.png"}','2026-01-15T00:01:53.251+00:00',1);
INSERT INTO PurchaseCard VALUES('f8e5faf1-21c9-439e-979b-6f4a7738d22e','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-99','Pangoro','99','{"small":"https://images.pokemontcg.io/sv9/99.png","large":"https://images.pokemontcg.io/sv9/99_hires.png"}','2026-01-15T00:01:53.258+00:00',1);
INSERT INTO PurchaseCard VALUES('4bc93b52-e92c-4701-a9c3-14b7d6c2953b','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-107','Magearna','107','{"small":"https://images.pokemontcg.io/sv9/107.png","large":"https://images.pokemontcg.io/sv9/107_hires.png"}','2026-01-15T00:01:53.263+00:00',1);
INSERT INTO PurchaseCard VALUES('9fc6b577-f8fd-4711-aa2e-9c0aeda5e852','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-109','Cufant','109','{"small":"https://images.pokemontcg.io/sv9/109.png","large":"https://images.pokemontcg.io/sv9/109_hires.png"}','2026-01-15T00:01:53.268+00:00',1);
INSERT INTO PurchaseCard VALUES('77855a1b-cfc4-4d38-a47b-0f1689698da8','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-111','Hop''s Zacian ex','111','{"small":"https://images.pokemontcg.io/sv9/111.png","large":"https://images.pokemontcg.io/sv9/111_hires.png"}','2026-01-15T00:01:53.274+00:00',1);
INSERT INTO PurchaseCard VALUES('24182b38-2aef-4abd-abe5-3748e5b5dce9','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-114','Salamence ex','114','{"small":"https://images.pokemontcg.io/sv9/114.png","large":"https://images.pokemontcg.io/sv9/114_hires.png"}','2026-01-15T00:01:53.279+00:00',1);
INSERT INTO PurchaseCard VALUES('5c98dc6b-03a5-45a2-8471-b5e962e4f74c','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-121','Dudunsparce ex','121','{"small":"https://images.pokemontcg.io/sv9/121.png","large":"https://images.pokemontcg.io/sv9/121_hires.png"}','2026-01-15T00:01:53.284+00:00',1);
INSERT INTO PurchaseCard VALUES('f0238801-c210-4a56-9c13-7eec0c9e825b','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-127','Noibat','127','{"small":"https://images.pokemontcg.io/sv9/127.png","large":"https://images.pokemontcg.io/sv9/127_hires.png"}','2026-01-15T00:01:53.289+00:00',1);
INSERT INTO PurchaseCard VALUES('dfbe5b5d-38cd-4623-b456-fb7b5b0cae20','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-133','Hop''s Rookidee','133','{"small":"https://images.pokemontcg.io/sv9/133.png","large":"https://images.pokemontcg.io/sv9/133_hires.png"}','2026-01-15T00:01:53.294+00:00',1);
INSERT INTO PurchaseCard VALUES('748e31f1-7dbf-4d3b-a12b-acaa18e4ceba','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-137','Cramorant','137','{"small":"https://images.pokemontcg.io/sv9/137.png","large":"https://images.pokemontcg.io/sv9/137_hires.png"}','2026-01-15T00:01:53.298+00:00',1);
INSERT INTO PurchaseCard VALUES('de4adbd5-8384-4b1b-91dc-9a33afc5d7ce','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-138','Hop''s Cramorant','138','{"small":"https://images.pokemontcg.io/sv9/138.png","large":"https://images.pokemontcg.io/sv9/138_hires.png"}','2026-01-15T00:01:53.303+00:00',1);
INSERT INTO PurchaseCard VALUES('5b4eb34e-172f-4377-b89b-02ef77c1c2d3','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-141','Squawkabilly','141','{"small":"https://images.pokemontcg.io/sv9/141.png","large":"https://images.pokemontcg.io/sv9/141_hires.png"}','2026-01-15T00:01:53.309+00:00',1);
INSERT INTO PurchaseCard VALUES('7db04939-5f2e-4b96-b9bb-e7532486253d','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-144','Black Belt''s Training','144','{"small":"https://images.pokemontcg.io/sv9/144.png","large":"https://images.pokemontcg.io/sv9/144_hires.png"}','2026-01-15T00:01:53.313+00:00',1);
INSERT INTO PurchaseCard VALUES('1ac024a0-7837-403f-8967-0d7a6554a0c9','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-155','Professor''s Research','155','{"small":"https://images.pokemontcg.io/sv9/155.png","large":"https://images.pokemontcg.io/sv9/155_hires.png"}','2026-01-15T00:01:53.318+00:00',1);
INSERT INTO PurchaseCard VALUES('d8164f4e-31fe-4cd5-b9cc-6f4d8753f15e','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-158','Super Potion','158','{"small":"https://images.pokemontcg.io/sv9/158.png","large":"https://images.pokemontcg.io/sv9/158_hires.png"}','2026-01-15T00:01:53.323+00:00',1);
INSERT INTO PurchaseCard VALUES('b53e12e1-80a7-4c42-a644-bf9a487b665f','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-160','Maractus','160','{"small":"https://images.pokemontcg.io/sv9/160.png","large":"https://images.pokemontcg.io/sv9/160_hires.png"}','2026-01-15T00:01:53.328+00:00',1);
INSERT INTO PurchaseCard VALUES('d84dac41-8251-4ee3-b748-16a50a6c312f','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-161','Articuno','161','{"small":"https://images.pokemontcg.io/sv9/161.png","large":"https://images.pokemontcg.io/sv9/161_hires.png"}','2026-01-15T00:01:53.333+00:00',1);
INSERT INTO PurchaseCard VALUES('ca12dbc6-5304-4293-8b9c-ed449290ae41','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-162','Wailord','162','{"small":"https://images.pokemontcg.io/sv9/162.png","large":"https://images.pokemontcg.io/sv9/162_hires.png"}','2026-01-15T00:01:53.337+00:00',1);
INSERT INTO PurchaseCard VALUES('35208c45-b8b2-44bf-90dd-16985f185b0b','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-166','Lycanroc','166','{"small":"https://images.pokemontcg.io/sv9/166.png","large":"https://images.pokemontcg.io/sv9/166_hires.png"}','2026-01-15T00:01:53.342+00:00',1);
INSERT INTO PurchaseCard VALUES('1c476a02-e332-4c21-9655-6ce4872ebadd','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-167','N''s Reshiram','167','{"small":"https://images.pokemontcg.io/sv9/167.png","large":"https://images.pokemontcg.io/sv9/167_hires.png"}','2026-01-15T00:01:53.350+00:00',1);
INSERT INTO PurchaseCard VALUES('c3792483-76a5-49ed-92c4-1a70181300fd','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-168','Furret','168','{"small":"https://images.pokemontcg.io/sv9/168.png","large":"https://images.pokemontcg.io/sv9/168_hires.png"}','2026-01-15T00:01:53.355+00:00',1);
INSERT INTO PurchaseCard VALUES('fbbe50b7-782e-4a04-b9fd-c46421c15498','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-169','Noibat','169','{"small":"https://images.pokemontcg.io/sv9/169.png","large":"https://images.pokemontcg.io/sv9/169_hires.png"}','2026-01-15T00:01:53.360+00:00',1);
INSERT INTO PurchaseCard VALUES('1a7032ab-704d-4925-9d50-0c7e8b3623c6','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-170','Hop''s Wooloo','170','{"small":"https://images.pokemontcg.io/sv9/170.png","large":"https://images.pokemontcg.io/sv9/170_hires.png"}','2026-01-15T00:01:53.364+00:00',1);
INSERT INTO PurchaseCard VALUES('16043064-5b67-4bf2-83be-51449e9a9f7c','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-171','Volcanion ex','171','{"small":"https://images.pokemontcg.io/sv9/171.png","large":"https://images.pokemontcg.io/sv9/171_hires.png"}','2026-01-15T00:01:53.369+00:00',1);
INSERT INTO PurchaseCard VALUES('c9d947f5-f47a-49b5-b2e2-abaced218ba5','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-174','Mamoswine ex','174','{"small":"https://images.pokemontcg.io/sv9/174.png","large":"https://images.pokemontcg.io/sv9/174_hires.png"}','2026-01-15T00:01:53.374+00:00',1);
INSERT INTO PurchaseCard VALUES('20257cbf-7b21-453b-a138-51bd0e29e093','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-173','Lillie''s Clefairy ex','173','{"small":"https://images.pokemontcg.io/sv9/173.png","large":"https://images.pokemontcg.io/sv9/173_hires.png"}','2026-01-15T00:01:53.378+00:00',1);
INSERT INTO PurchaseCard VALUES('a0b3cb01-71ec-4da7-be19-4e3611192acc','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-175','N''s Zoroark ex','175','{"small":"https://images.pokemontcg.io/sv9/175.png","large":"https://images.pokemontcg.io/sv9/175_hires.png"}','2026-01-15T00:01:53.382+00:00',1);
INSERT INTO PurchaseCard VALUES('861793c6-4109-490c-91a4-7dac1ee103e4','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-177','Salamence ex','177','{"small":"https://images.pokemontcg.io/sv9/177.png","large":"https://images.pokemontcg.io/sv9/177_hires.png"}','2026-01-15T00:01:53.387+00:00',1);
INSERT INTO PurchaseCard VALUES('4865f275-2c97-4fb5-9ff5-1511fc5474c6','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-178','Dudunsparce ex','178','{"small":"https://images.pokemontcg.io/sv9/178.png","large":"https://images.pokemontcg.io/sv9/178_hires.png"}','2026-01-15T00:01:53.391+00:00',1);
INSERT INTO PurchaseCard VALUES('f638afe1-98e6-461c-804d-2839784f37c0','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-179','Brock''s Scouting','179','{"small":"https://images.pokemontcg.io/sv9/179.png","large":"https://images.pokemontcg.io/sv9/179_hires.png"}','2026-01-15T00:01:53.395+00:00',1);
INSERT INTO PurchaseCard VALUES('4e5c637d-ae6a-41d6-a1d4-35597b08d0c1','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-180','Iris''s Fighting Spirit','180','{"small":"https://images.pokemontcg.io/sv9/180.png","large":"https://images.pokemontcg.io/sv9/180_hires.png"}','2026-01-15T00:01:53.400+00:00',1);
INSERT INTO PurchaseCard VALUES('a3ca7ce1-1bfe-4325-b472-adc9122c7749','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-182','Volcanion ex','182','{"small":"https://images.pokemontcg.io/sv9/182.png","large":"https://images.pokemontcg.io/sv9/182_hires.png"}','2026-01-15T00:01:53.404+00:00',1);
INSERT INTO PurchaseCard VALUES('e08e9cc1-a07b-456b-b9de-28df4620d01d','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-183','Iono''s Bellibolt ex','183','{"small":"https://images.pokemontcg.io/sv9/183.png","large":"https://images.pokemontcg.io/sv9/183_hires.png"}','2026-01-15T00:01:53.409+00:00',1);
INSERT INTO PurchaseCard VALUES('c691dad6-4dfd-4801-9e5c-d11e62e54f05','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-184','Lillie''s Clefairy ex','184','{"small":"https://images.pokemontcg.io/sv9/184.png","large":"https://images.pokemontcg.io/sv9/184_hires.png"}','2026-01-15T00:01:53.414+00:00',1);
INSERT INTO PurchaseCard VALUES('5f774e76-817e-4a54-bac9-0a11826ee751','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-185','N''s Zoroark ex','185','{"small":"https://images.pokemontcg.io/sv9/185.png","large":"https://images.pokemontcg.io/sv9/185_hires.png"}','2026-01-15T00:01:53.418+00:00',1);
INSERT INTO PurchaseCard VALUES('2017806b-69f4-4d42-8f56-4454c4159c76','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-186','Hop''s Zacian ex','186','{"small":"https://images.pokemontcg.io/sv9/186.png","large":"https://images.pokemontcg.io/sv9/186_hires.png"}','2026-01-15T00:01:53.423+00:00',1);
INSERT INTO PurchaseCard VALUES('98c46a0b-a570-436f-a712-e1aec8e6b2f4','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-187','Salamence ex','187','{"small":"https://images.pokemontcg.io/sv9/187.png","large":"https://images.pokemontcg.io/sv9/187_hires.png"}','2026-01-15T00:01:53.427+00:00',1);
INSERT INTO PurchaseCard VALUES('25acd3fc-5d90-43f4-9874-c716ae44a3d7','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-188','Iono''s Bellibolt ex','188','{"small":"https://images.pokemontcg.io/sv9/188.png","large":"https://images.pokemontcg.io/sv9/188_hires.png"}','2026-01-15T00:01:53.431+00:00',1);
INSERT INTO PurchaseCard VALUES('63a68ae9-6f6c-4c1a-8d5f-8f0330d5c27a','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-189','N''s Zoroark ex','189','{"small":"https://images.pokemontcg.io/sv9/189.png","large":"https://images.pokemontcg.io/sv9/189_hires.png"}','2026-01-15T00:01:53.436+00:00',1);
INSERT INTO PurchaseCard VALUES('0edd5d74-aa86-4ca8-ad17-aa41a0dc882e','97585af3-a602-4d42-915c-d51a1d2db50f','sv9','Journey Together','sv9-190','Spiky Energy','190','{"small":"https://images.pokemontcg.io/sv9/190.png","large":"https://images.pokemontcg.io/sv9/190_hires.png"}','2026-01-15T00:01:53.443+00:00',1);
INSERT INTO PurchaseCard VALUES('e75f58e1-8ec8-4cb9-9c1b-bb2a78a1ccfa','97585af3-a602-4d42-915c-d51a1d2db50f','me2','Phantasmal Flames','me2-19','Charcadet','19','{"small":"https://images.pokemontcg.io/me2/19.png","large":"https://images.pokemontcg.io/me2/19_hires.png"}','2026-01-15T00:01:53.447+00:00',1);
INSERT INTO PurchaseCard VALUES('c1f01814-2998-4e3c-9611-aa1c22f9ba89','97585af3-a602-4d42-915c-d51a1d2db50f','me2','Phantasmal Flames','me2-23','Swinub','23','{"small":"https://images.pokemontcg.io/me2/23.png","large":"https://images.pokemontcg.io/me2/23_hires.png"}','2026-01-15T00:01:53.452+00:00',1);
INSERT INTO PurchaseCard VALUES('e25811c6-8c8e-430e-b26c-866ab3f581e3','97585af3-a602-4d42-915c-d51a1d2db50f','me2','Phantasmal Flames','me2-22','Dewgong','22','{"small":"https://images.pokemontcg.io/me2/22.png","large":"https://images.pokemontcg.io/me2/22_hires.png"}','2026-01-15T00:01:53.456+00:00',1);
INSERT INTO PurchaseCard VALUES('5332ac69-4955-4511-a079-025df813eca2','97585af3-a602-4d42-915c-d51a1d2db50f','me1','Mega Evolution','me1-22','Mega Camerupt ex','22','{"small":"https://images.pokemontcg.io/me1/22.png","large":"https://images.pokemontcg.io/me1/22_hires.png"}','2026-01-15T00:01:53.461+00:00',1);
INSERT INTO PurchaseCard VALUES('31f4e65c-f851-4ae2-a6f3-0edf7bde61fb','97585af3-a602-4d42-915c-d51a1d2db50f','me1','Mega Evolution','me1-21','Numel','21','{"small":"https://images.pokemontcg.io/me1/21.png","large":"https://images.pokemontcg.io/me1/21_hires.png"}','2026-01-15T00:01:53.465+00:00',1);
INSERT INTO PurchaseCard VALUES('6b1894ba-982d-43b5-bd7f-516e172f7c38','97585af3-a602-4d42-915c-d51a1d2db50f','me1','Mega Evolution','me1-20','Ninetales','20','{"small":"https://images.pokemontcg.io/me1/20.png","large":"https://images.pokemontcg.io/me1/20_hires.png"}','2026-01-15T00:01:53.469+00:00',1);
CREATE TABLE IF NOT EXISTS "ShopCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ShopCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "PurchaseOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorEmail" TEXT NOT NULL,
    "visitorPhone" TEXT,
    "cards" TEXT NOT NULL,
    "totalExpected" REAL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ShopOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "cards" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShopOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "houseNumberExt" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'NL',
    "phoneNumber" TEXT,
    "dateOfBirth" DATETIME,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "UserWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "dailySpendLimit" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "shippingAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pricePerUnit" REAL NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pokemonTcgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "setCode" TEXT,
    "number" TEXT,
    "rarity" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Card VALUES('a14c30ed-bdd7-4096-8da0-9ca6dcf163a5','base1-4','Charizard','Base Set','base1','4','Rare Holo','https://images.pokemontcg.io/base1/4_hires.png','2026-01-16T01:01:01.266+00:00','2026-01-16T01:01:01.266+00:00');
INSERT INTO Card VALUES('4a0faa55-52d1-4387-97bd-d4d590a2e2e7','base1-58','Pikachu','Base Set','base1','58','Common','https://images.pokemontcg.io/base1/58_hires.png','2026-01-16T01:01:01.271+00:00','2026-01-16T01:01:01.271+00:00');
INSERT INTO Card VALUES('38202988-ca0d-402b-a1d6-a4878d511107','xy1-1','Venusaur-EX','XY','xy1','1','Rare Holo EX','https://images.pokemontcg.io/xy1/1_hires.png','2026-01-16T01:01:01.274+00:00','2026-01-16T01:01:01.274+00:00');
CREATE TABLE IF NOT EXISTS "CardPricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "tcgplayerPriceUSD" REAL,
    "tcgplayerUrl" TEXT,
    "tcgplayerUpdated" DATETIME,
    "customPriceEUR" REAL,
    "useCustomPrice" BOOLEAN NOT NULL DEFAULT false,
    "cardmarketUrl" TEXT,
    "showTCGPrice" BOOLEAN NOT NULL DEFAULT true,
    "showCardmarketLink" BOOLEAN NOT NULL DEFAULT true,
    "usdToEurRate" REAL,
    "lastRateUpdate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CardPricing_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "ApiCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO User VALUES('97585af3-a602-4d42-915c-d51a1d2db50f','admin','camiel@1mail.nl','$2b$10$iP5/XAY4v2jmxtFYbYwF5eN0V0W0Rvsz9GZTROKxze3ncLXMp55jW','admin',NULL,'2026-01-14T23:52:44.747+00:00','2026-01-16 01:00:48');
CREATE INDEX "PurchaseCard_userId_idx" ON "PurchaseCard"("userId");
CREATE UNIQUE INDEX "PurchaseCard_userId_setId_cardId_key" ON "PurchaseCard"("userId", "setId", "cardId");
CREATE INDEX "ShopCard_userId_idx" ON "ShopCard"("userId");
CREATE UNIQUE INDEX "ShopCard_userId_setId_cardId_key" ON "ShopCard"("userId", "setId", "cardId");
CREATE INDEX "PurchaseOffer_userId_idx" ON "PurchaseOffer"("userId");
CREATE INDEX "ShopOrder_userId_idx" ON "ShopOrder"("userId");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "UserWallet"("userId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_providerId_idx" ON "Transaction"("providerId");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_cardId_idx" ON "OrderItem"("cardId");
CREATE UNIQUE INDEX "Card_pokemonTcgId_key" ON "Card"("pokemonTcgId");
CREATE INDEX "Card_name_idx" ON "Card"("name");
CREATE INDEX "Card_setName_idx" ON "Card"("setName");
CREATE UNIQUE INDEX "CardPricing_cardId_key" ON "CardPricing"("cardId");
CREATE UNIQUE INDEX "ApiCredential_service_key" ON "ApiCredential"("service");
COMMIT;
