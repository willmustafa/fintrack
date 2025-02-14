export default function Features() {
  return (
    <div className="text-center pt-12 pb-16 lg:pt-16" id="recursos">
      <h4 className="text-xl font-bold mb-4">
        <span className="text-red-500">#</span> Recursos?
      </h4>
      <h2 className="text-4xl mb-20">
        Organize tudo relacionado ao seu Dinheiro em um só lugar!
      </h2>
      <div className="text-left px-4 sm:px-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-5">
          <div className="mb-16 lg:mb-0 xl:mt-16">
            <h2 className="text-3xl font-bold mb-6">
              Lorem ipsum dolor sit amet
            </h2>
            <p className="mb-4">
              Lorem ipsum dolor sit amet Lorem ipsum dolor sit amet Lorem ipsum
              dolor sit amet Lorem ipsum dolor sit amet
            </p>
            <p className="mb-4">
              Lorem ipsum dolor sit amet Lorem ipsum dolor sit amet Lorem ipsum
              dolor sit amet
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <div className="xl:ml-14">
            <img
              className="inline"
              src="https://themewagon.github.io/pavo/images/details-1.jpg"
              alt="alternative"
            />
          </div>
        </div>
      </div>
      <div className="px-4 pt-28 sm:px-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7">
          <div className="mb-12 lg:mb-0 xl:mr-14">
            <img
              className="inline"
              src="https://themewagon.github.io/pavo/images/details-2.jpg"
              alt="alternative"
            />
          </div>
        </div>
        <div className="lg:col-span-5 text-start">
          <div className="xl:mt-12">
            <h2 className="text-3xl font-bold mb-6">
              Lorem ipsum dolor sit amet
            </h2>
            <ul className="list mb-7 space-y-2">
              <li className="flex">
                <div>Lorem ipsum dolor sit amet</div>
              </li>
              <li className="flex">
                <div>Lorem ipsum dolor sit amet</div>
              </li>
              <li className="flex">
                <div>Lorem ipsum dolor sit amet</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
