import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const Result = () => {
  const { image, resultImage } = useContext(AppContext);
  return (
    <div className='mx-4 my-3 lg:mx-44 mt-14 min-h-[75vh] '>
      <div className='bg-white rounded-lg px-8 py-6 drop-shadow-sm'>
        <div className='flex flex-col sm:grid grid-cols-2 gap-8'>
          <div>
            <p className='font-semibold text-gray-600 mb-2'>Orginal</p>
            <img
              className='rounded-md border'
              src={image ? URL.createObjectURL(image) : ""}
              alt='bg'
            />
          </div>
          <div className='flex flex-col'>
            <p className='font-semibold text-gray-600 mb-2'>
              Background Removed
            </p>
            <div className='rounded-md border border-gray-300 h-full relative bg-layer overflow-hidden'>
              <img src={resultImage ? resultImage : ""} />

              {!resultImage && image && (
                <div className='absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2'>
                  <div className='border-4 border-violet-600 rounded-full h-12 w-12 border-t-transparent animate-spin'></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {resultImage && (
          <div className='flex justify-center sm:justify-end items-center flex-wrap gap-4 mt-6'>
            <div>
              <input
                onChange={(e) => removeBG(e.target.files[0])}
                accept='image/*'
                type='file'
                id='image1'
                hidden
              />
              <label
                htmlFor='image1'
                className='inline-flex gap-3 px-8 py-3.5 rounded-full cursor-pointer bg-gradient-to-r from-violet-600 to-fuchsia-500 m-auto hover:scale-105 transition-all duration-700'
              >
                <img width={20} src={assets.upload_btn_icon} alt='upload btn' />
                <p className='text-white text-sm'>Try another image</p>
              </label>
            </div>
            <a
              className='px-8 py-2.5 text-white text-sm bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full  hover:scale-105 transition-all duration-700'
              href={resultImage}
              download
            >
              Download image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;